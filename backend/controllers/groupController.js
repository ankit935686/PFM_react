const mongoose = require('mongoose');
const crypto = require('crypto');
const Group = require('../models/groupModel');
const User = require('../models/userModel');
const GroupExpense = require('../models/groupExpenseModel');
const GroupSettlement = require('../models/groupSettlementModel');
const GroupActivityLog = require('../models/groupActivityLogModel');
const GroupNotification = require('../models/groupNotificationModel');
const Expense = require('../models/expenseModel');
const {
  calculateSplits,
  round2,
} = require('../services/group/splitCalculationEngine');
const {
  applyExpenseToLedger,
  applySettlementToLedger,
  getGroupBalances,
  simplifyDebts,
  rebuildGroupLedger,
} = require('../services/group/balanceLedgerService');
const {
  syncGroupExpenseToPersonal,
  syncSettlementToPersonal,
} = require('../services/group/transactionSyncService');
const { createActivity, createNotifications } = require('../services/group/activityNotificationService');
const { getGroupAnalytics } = require('../services/group/groupAnalyticsService');

const getUserIdFromRequest = (req) => req.userId || req.user?.userId || req.user?._id || req.user?.id || null;

const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const normalizeGroupForUser = (group, userId) => {
  const members = group.members || [];
  const me = members.find((m) => String(m.userId) === String(userId));
  return {
    ...group,
    memberCount: members.length,
    myRole: me?.role || null,
    amOwner: String(group.ownerUserId) === String(userId),
  };
};

const ensureGroupMembership = (group, userId) => {
  const member = (group.members || []).find((m) => String(m.userId) === String(userId));
  if (!member) {
    throw new Error('You are not a member of this group.');
  }
  return member;
};

const ensureAdminOrOwner = (group, userId) => {
  const member = ensureGroupMembership(group, userId);
  if (member.role !== 'owner' && member.role !== 'admin') {
    throw new Error('Only group admins can perform this action.');
  }
};

const createGroup = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { name, description, category } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Group name is required.' });

    const user = await User.findById(userId).lean();

    let createdGroup;
    await session.withTransaction(async () => {
      createdGroup = await Group.create(
        [
          {
            name: String(name).trim(),
            description: String(description || '').trim(),
            category: String(category || 'General').trim(),
            inviteCode: generateInviteCode(),
            ownerUserId: userId,
            members: [
              {
                userId,
                role: 'owner',
                displayNameSnapshot: user?.email || 'Owner',
                emailSnapshot: user?.email || '',
              },
            ],
          },
        ],
        { session }
      );
      const group = createdGroup[0];
      await createActivity({
        groupId: group._id,
        actorUserId: userId,
        type: 'group_created',
        title: `Group created: ${group.name}`,
        description: 'New expense-sharing group was created.',
        session,
      });
      await createNotifications({
        userIds: [userId],
        groupId: group._id,
        type: 'group_created',
        title: `You created ${group.name}`,
        description: 'Invite members to start sharing expenses.',
        session,
      });
    });

    return res.status(201).json({ group: normalizeGroupForUser(createdGroup[0].toObject(), userId) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create group', error: error.message });
  } finally {
    session.endSession();
  }
};

const listGroups = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const groups = await Group.find({ 'members.userId': userId, archived: false }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({
      groups: groups.map((group) => normalizeGroupForUser(group, userId)),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch groups', error: error.message });
  }
};

const getGroupById = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);
    return res.status(200).json({ group: normalizeGroupForUser(group, userId) });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to fetch group' });
  }
};

const joinGroup = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { inviteCode } = req.body || {};
    if (!inviteCode) return res.status(400).json({ message: 'inviteCode is required.' });

    const user = await User.findById(userId).lean();
    let groupDoc;
    await session.withTransaction(async () => {
      groupDoc = await Group.findOne({ inviteCode: String(inviteCode).trim().toUpperCase(), archived: false }).session(session);
      if (!groupDoc) throw new Error('Invalid invite code.');
      const alreadyMember = groupDoc.members.some((m) => String(m.userId) === String(userId));
      if (!alreadyMember) {
        groupDoc.members.push({
          userId,
          role: 'member',
          displayNameSnapshot: user?.email || 'Member',
          emailSnapshot: user?.email || '',
        });
        await groupDoc.save({ session });
        const memberIds = groupDoc.members.map((m) => m.userId);
        await createActivity({
          groupId: groupDoc._id,
          actorUserId: userId,
          type: 'member_joined',
          title: `${user?.email || 'A user'} joined group`,
          description: `${user?.email || 'A user'} joined via invite code.`,
          session,
        });
        await createNotifications({
          userIds: memberIds,
          groupId: groupDoc._id,
          type: 'member_joined',
          title: `${user?.email || 'A user'} joined ${groupDoc.name}`,
          description: 'Group member list has been updated.',
          payload: { userId },
          session,
        });
      }
    });

    return res.status(200).json({ group: normalizeGroupForUser(groupDoc.toObject(), userId) });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to join group' });
  } finally {
    session.endSession();
  }
};

const addMember = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const { firebaseUid, email, role = 'member' } = req.body || {};
    if (!firebaseUid && !email) {
      return res.status(400).json({ message: 'firebaseUid or email is required.' });
    }
    const user = await User.findOne(firebaseUid ? { firebaseUid } : { email }).lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await session.withTransaction(async () => {
      const group = await Group.findById(groupId).session(session);
      if (!group) throw new Error('Group not found.');
      ensureAdminOrOwner(group, userId);
      const exists = group.members.some((m) => String(m.userId) === String(user._id));
      if (!exists) {
        group.members.push({
          userId: user._id,
          role: ['owner', 'admin', 'member'].includes(role) ? role : 'member',
          displayNameSnapshot: user.email || 'Member',
          emailSnapshot: user.email || '',
        });
        await group.save({ session });
        const memberIds = group.members.map((m) => m.userId);
        await createActivity({
          groupId: group._id,
          actorUserId: userId,
          type: 'member_added',
          title: `${user.email || 'Member'} added to group`,
          description: 'Group member was added by admin.',
          session,
        });
        await createNotifications({
          userIds: memberIds,
          groupId: group._id,
          type: 'member_added',
          title: `${user.email || 'Member'} was added`,
          description: `Member joined ${group.name}.`,
          payload: { memberUserId: user._id },
          session,
        });
      }
    });

    const refreshed = await Group.findById(groupId).lean();
    return res.status(200).json({ group: normalizeGroupForUser(refreshed, userId) });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to add member' });
  } finally {
    session.endSession();
  }
};

const removeMember = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const actorUserId = getUserIdFromRequest(req);
    const { groupId, memberUserId } = req.params;
    await session.withTransaction(async () => {
      const group = await Group.findById(groupId).session(session);
      if (!group) throw new Error('Group not found.');
      ensureAdminOrOwner(group, actorUserId);
      if (String(group.ownerUserId) === String(memberUserId)) {
        throw new Error('Owner cannot be removed.');
      }
      const before = group.members.length;
      group.members = group.members.filter((m) => String(m.userId) !== String(memberUserId));
      if (group.members.length === before) throw new Error('Member not found in group.');
      await group.save({ session });

      await createActivity({
        groupId,
        actorUserId,
        type: 'member_removed',
        title: 'Member removed from group',
        description: 'Group member was removed by admin.',
        metadata: { memberUserId },
        session,
      });
      await createNotifications({
        userIds: group.members.map((m) => m.userId),
        groupId,
        type: 'member_removed',
        title: 'A member was removed',
        description: 'Group roster has changed.',
        payload: { memberUserId },
        session,
      });
    });

    const refreshed = await Group.findById(groupId).lean();
    return res.status(200).json({ group: normalizeGroupForUser(refreshed, actorUserId) });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to remove member' });
  } finally {
    session.endSession();
  }
};

const addExpense = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const actorUserId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const {
      title,
      amount,
      paidByUserId,
      splitType,
      participantUserIds,
      splitInputs,
      occurredAt,
      category,
      notes,
      receiptImageUrl,
      receiptScan,
    } = req.body || {};

    if (!title || !splitType || !paidByUserId || !Array.isArray(participantUserIds) || participantUserIds.length === 0) {
      return res.status(400).json({ message: 'title, splitType, paidByUserId, and participantUserIds are required.' });
    }

    let expenseDoc;
    await session.withTransaction(async () => {
      const group = await Group.findById(groupId).session(session);
      if (!group) throw new Error('Group not found.');
      ensureGroupMembership(group, actorUserId);
      const memberIdsSet = new Set(group.members.map((m) => String(m.userId)));
      if (!memberIdsSet.has(String(paidByUserId))) throw new Error('Payer must be a group member.');
      for (const memberId of participantUserIds) {
        if (!memberIdsSet.has(String(memberId))) {
          throw new Error('All participants must be group members.');
        }
      }

      const splits = calculateSplits({
        splitType,
        amount: Number(amount),
        participantUserIds,
        splitInputs: splitInputs || [],
      });

      const personalExpense = await syncGroupExpenseToPersonal({
        userId: paidByUserId,
        amount: Number(amount),
        category: category || 'Group Expense',
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        groupName: group.name,
        expenseTitle: title,
        session,
      });

      const created = await GroupExpense.create(
        [
          {
            groupId,
            createdByUserId: actorUserId,
            paidByUserId,
            title: String(title).trim(),
            amount: round2(amount),
            splitType,
            category: category || 'Group Expense',
            notes: notes || '',
            receiptImageUrl: receiptImageUrl || '',
            receiptScan: receiptScan || null,
            occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
            participantUserIds,
            splits,
            linkedPersonalExpenseId: personalExpense?._id || null,
          },
        ],
        { session }
      );

      expenseDoc = created[0];
      await applyExpenseToLedger({
        groupId,
        paidByUserId,
        splits,
        session,
      });

      for (const member of group.members) {
        if (String(member.userId) === String(paidByUserId)) {
          member.totalContributed = round2(Number(member.totalContributed || 0) + Number(amount || 0));
        }
      }
      await group.save({ session });

      const memberIds = group.members.map((m) => m.userId);
      await createActivity({
        groupId,
        actorUserId,
        type: 'expense_added',
        title: `${title} added`,
        description: `Expense ${round2(amount)} was added and split.`,
        metadata: { expenseId: expenseDoc._id },
        session,
      });
      await createNotifications({
        userIds: memberIds,
        groupId,
        type: 'expense_added',
        title: `${title} added in ${group.name}`,
        description: `Amount ${round2(amount)} split among members.`,
        payload: { expenseId: expenseDoc._id },
        session,
      });
    });

    return res.status(201).json({ expense: expenseDoc });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to add expense' });
  } finally {
    session.endSession();
  }
};

const listExpenses = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);
    const expenses = await GroupExpense.find({ groupId, isDeleted: false }).sort({ occurredAt: -1, createdAt: -1 }).lean();
    return res.status(200).json({ expenses });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to fetch expenses' });
  }
};

const deleteExpense = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId, expenseId } = req.params;
    let expense;
    await session.withTransaction(async () => {
      const group = await Group.findById(groupId).session(session);
      if (!group) throw new Error('Group not found.');
      ensureAdminOrOwner(group, userId);
      expense = await GroupExpense.findOneAndUpdate(
        { _id: expenseId, groupId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true, session }
      );
      if (!expense) throw new Error('Expense not found.');

      await rebuildGroupLedger({ groupId, session });

      await createActivity({
        groupId,
        actorUserId: userId,
        type: 'expense_deleted',
        title: 'Expense deleted',
        description: `${expense.title} deleted.`,
        session,
      });
    });
    return res.status(200).json({ message: 'Expense marked deleted.', expense });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to delete expense' });
  } finally {
    session.endSession();
  }
};

const editExpense = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const actorUserId = getUserIdFromRequest(req);
    const { groupId, expenseId } = req.params;
    const {
      title,
      amount,
      paidByUserId,
      splitType,
      participantUserIds,
      splitInputs,
      occurredAt,
      category,
      notes,
      receiptImageUrl,
      receiptScan,
    } = req.body || {};

    let updatedExpense;
    await session.withTransaction(async () => {
      const group = await Group.findById(groupId).session(session);
      if (!group) throw new Error('Group not found.');
      ensureAdminOrOwner(group, actorUserId);

      const existing = await GroupExpense.findOne({ _id: expenseId, groupId, isDeleted: false }).session(session);
      if (!existing) throw new Error('Expense not found.');

      const memberIdsSet = new Set(group.members.map((m) => String(m.userId)));
      const nextPayerId = paidByUserId || existing.paidByUserId;
      const nextParticipants = Array.isArray(participantUserIds) && participantUserIds.length > 0
        ? participantUserIds
        : existing.participantUserIds;

      if (!memberIdsSet.has(String(nextPayerId))) throw new Error('Payer must be a group member.');
      for (const memberId of nextParticipants) {
        if (!memberIdsSet.has(String(memberId))) throw new Error('All participants must be group members.');
      }

      const nextAmount = amount !== undefined ? Number(amount) : Number(existing.amount);
      const nextSplitType = splitType || existing.splitType;
      const nextSplits = calculateSplits({
        splitType: nextSplitType,
        amount: nextAmount,
        participantUserIds: nextParticipants,
        splitInputs: splitInputs || existing.splits || [],
      });

      existing.title = title !== undefined ? String(title).trim() : existing.title;
      existing.amount = round2(nextAmount);
      existing.paidByUserId = nextPayerId;
      existing.splitType = nextSplitType;
      existing.category = category !== undefined ? category : existing.category;
      existing.notes = notes !== undefined ? notes : existing.notes;
      existing.receiptImageUrl = receiptImageUrl !== undefined ? receiptImageUrl : existing.receiptImageUrl;
      existing.receiptScan = receiptScan !== undefined ? receiptScan : existing.receiptScan;
      existing.occurredAt = occurredAt ? new Date(occurredAt) : existing.occurredAt;
      existing.participantUserIds = nextParticipants;
      existing.splits = nextSplits;
      await existing.save({ session });

      if (existing.linkedPersonalExpenseId) {
        await Expense.findByIdAndUpdate(
          existing.linkedPersonalExpenseId,
          {
            $set: {
              amount: existing.amount,
              category: existing.category || 'Group Expense',
              date: existing.occurredAt,
              notes: `[Group:${group.name}] ${existing.title}`,
            },
          },
          { session }
        );
      }

      await rebuildGroupLedger({ groupId, session });

      await createActivity({
        groupId,
        actorUserId,
        type: 'expense_updated',
        title: 'Expense updated',
        description: `${existing.title} was edited.`,
        metadata: { expenseId: existing._id },
        session,
      });

      await createNotifications({
        userIds: group.members.map((m) => m.userId),
        groupId,
        type: 'expense_updated',
        title: `${existing.title} updated`,
        description: 'Expense split/balance has been refreshed.',
        payload: { expenseId: existing._id },
        session,
      });

      updatedExpense = existing;
    });

    return res.status(200).json({ expense: updatedExpense });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to edit expense' });
  } finally {
    session.endSession();
  }
};

const settlePayment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const actorUserId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const { paidByUserId, receivedByUserId, amount, note, settledAt } = req.body || {};
    if (!paidByUserId || !receivedByUserId || Number(amount) <= 0) {
      return res.status(400).json({ message: 'paidByUserId, receivedByUserId, amount are required.' });
    }

    let settlementDoc;
    await session.withTransaction(async () => {
      const group = await Group.findById(groupId).session(session);
      if (!group) throw new Error('Group not found.');
      ensureGroupMembership(group, actorUserId);
      ensureGroupMembership(group, paidByUserId);
      ensureGroupMembership(group, receivedByUserId);

      await applySettlementToLedger({
        groupId,
        paidByUserId,
        receivedByUserId,
        amount: Number(amount),
        session,
      });

      const synced = await syncSettlementToPersonal({
        payerUserId: paidByUserId,
        receiverUserId: receivedByUserId,
        amount: Number(amount),
        settledAt: settledAt ? new Date(settledAt) : new Date(),
        groupName: group.name,
        note: note || '',
        session,
      });

      const created = await GroupSettlement.create(
        [
          {
            groupId,
            paidByUserId,
            receivedByUserId,
            amount: round2(amount),
            note: note || '',
            settledAt: settledAt ? new Date(settledAt) : new Date(),
            linkedPayerExpenseId: synced.payerExpense?._id || null,
            linkedReceiverIncomeId: synced.receiverIncome?._id || null,
          },
        ],
        { session }
      );
      settlementDoc = created[0];

      for (const member of group.members) {
        if (String(member.userId) === String(paidByUserId)) {
          member.totalSettledPaid = round2(Number(member.totalSettledPaid || 0) + Number(amount || 0));
        }
        if (String(member.userId) === String(receivedByUserId)) {
          member.totalSettledReceived = round2(Number(member.totalSettledReceived || 0) + Number(amount || 0));
        }
      }
      await group.save({ session });

      const memberIds = group.members.map((m) => m.userId);
      await createActivity({
        groupId,
        actorUserId,
        type: 'settlement_added',
        title: 'Settlement recorded',
        description: `Settlement ${round2(amount)} recorded.`,
        metadata: { settlementId: settlementDoc._id },
        session,
      });
      await createNotifications({
        userIds: memberIds,
        groupId,
        type: 'settlement_added',
        title: 'Group settlement recorded',
        description: `${round2(amount)} settled in ${group.name}.`,
        payload: { settlementId: settlementDoc._id },
        session,
      });
    });

    return res.status(201).json({ settlement: settlementDoc });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to record settlement' });
  } finally {
    session.endSession();
  }
};

const getBalances = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);
    const balances = await getGroupBalances({ groupId });
    return res.status(200).json({ balances });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to fetch balances' });
  }
};

const getSimplifiedDebts = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);
    const balances = await getGroupBalances({ groupId });
    const simplified = simplifyDebts(balances);
    return res.status(200).json({ simplified });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to simplify debts' });
  }
};

const getGroupActivity = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);
    const activity = await GroupActivityLog.find({ groupId }).sort({ createdAt: -1 }).limit(200).lean();
    return res.status(200).json({ activity });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to fetch activity' });
  }
};

const getGroupSettlements = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);
    const settlements = await GroupSettlement.find({ groupId }).sort({ settledAt: -1 }).lean();
    return res.status(200).json({ settlements });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to fetch settlements' });
  }
};

const getGroupNotifications = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);
    const notifications = await GroupNotification.find({ groupId, userId }).sort({ createdAt: -1 }).limit(200).lean();
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to fetch group notifications' });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const notifications = await GroupNotification.find({ userId }).sort({ createdAt: -1 }).limit(300).lean();
    return res.status(200).json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { notificationId } = req.params;
    const updated = await GroupNotification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: 'Notification not found.' });
    return res.status(200).json({ notification: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification', error: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { groupId } = req.params;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    ensureGroupMembership(group, userId);

    const analytics = await getGroupAnalytics({ groupId, userId });
    const balances = await getGroupBalances({ groupId });
    const simplified = simplifyDebts(balances);
    const activity = await GroupActivityLog.find({ groupId }).sort({ createdAt: -1 }).limit(20).lean();

    return res.status(200).json({
      groupOverview: {
        groupId,
        memberCount: group.members.length,
        ...analytics,
      },
      balances,
      simplifiedDebts: simplified,
      recentActivity: activity,
    });
  } catch (error) {
    return res.status(403).json({ message: error.message || 'Failed to fetch analytics' });
  }
};

module.exports = {
  createGroup,
  listGroups,
  getGroupById,
  joinGroup,
  addMember,
  removeMember,
  addExpense,
  editExpense,
  listExpenses,
  deleteExpense,
  settlePayment,
  getBalances,
  getSimplifiedDebts,
  getGroupActivity,
  getGroupSettlements,
  getGroupNotifications,
  getMyNotifications,
  markNotificationRead,
  getAnalytics,
};
