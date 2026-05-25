const GroupBalanceLedger = require('../../models/groupBalanceLedgerModel');
const GroupExpense = require('../../models/groupExpenseModel');
const GroupSettlement = require('../../models/groupSettlementModel');
const { round2 } = require('./splitCalculationEngine');

const applyDirectedDebt = async ({ groupId, fromUserId, toUserId, amount, session }) => {
  const debtAmount = round2(amount);
  if (debtAmount <= 0 || String(fromUserId) === String(toUserId)) return;

  const reverse = await GroupBalanceLedger.findOne({
    groupId,
    fromUserId: toUserId,
    toUserId: fromUserId,
  }).session(session);

  if (reverse) {
    const reverseAmount = round2(reverse.amount);
    if (reverseAmount > debtAmount) {
      reverse.amount = round2(reverseAmount - debtAmount);
      reverse.lastActivityAt = new Date();
      await reverse.save({ session });
      return;
    }
    if (reverseAmount === debtAmount) {
      await reverse.deleteOne({ session });
      return;
    }
    await reverse.deleteOne({ session });
    const net = round2(debtAmount - reverseAmount);
    await GroupBalanceLedger.findOneAndUpdate(
      { groupId, fromUserId, toUserId },
      { $set: { lastActivityAt: new Date() }, $inc: { amount: net } },
      { upsert: true, new: true, setDefaultsOnInsert: true, session }
    );
    return;
  }

  await GroupBalanceLedger.findOneAndUpdate(
    { groupId, fromUserId, toUserId },
    { $set: { lastActivityAt: new Date() }, $inc: { amount: debtAmount } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
};

const applyExpenseToLedger = async ({ groupId, paidByUserId, splits, session }) => {
  for (const split of splits) {
    if (String(split.userId) === String(paidByUserId)) continue;
    const owes = round2(split.amount);
    if (owes <= 0) continue;
    await applyDirectedDebt({
      groupId,
      fromUserId: split.userId,
      toUserId: paidByUserId,
      amount: owes,
      session,
    });
  }
};

const applySettlementToLedger = async ({ groupId, paidByUserId, receivedByUserId, amount, session }) => {
  await applyDirectedDebt({
    groupId,
    fromUserId: receivedByUserId,
    toUserId: paidByUserId,
    amount,
    session,
  });
};

const getGroupBalances = async ({ groupId }) => {
  const rows = await GroupBalanceLedger.find({ groupId }).sort({ amount: -1, updatedAt: -1 }).lean();
  return rows.map((row) => ({
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    amount: round2(row.amount),
    lastActivityAt: row.lastActivityAt,
  }));
};

const simplifyDebts = (ledgerRows = []) => {
  const net = new Map();
  for (const row of ledgerRows) {
    const fromKey = String(row.fromUserId);
    const toKey = String(row.toUserId);
    const amount = round2(row.amount);
    net.set(fromKey, round2((net.get(fromKey) || 0) - amount));
    net.set(toKey, round2((net.get(toKey) || 0) + amount));
  }

  const creditors = [];
  const debtors = [];
  for (const [userId, value] of net.entries()) {
    if (value > 0.009) creditors.push({ userId, amount: round2(value) });
    if (value < -0.009) debtors.push({ userId, amount: round2(Math.abs(value)) });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = round2(Math.min(debtors[i].amount, creditors[j].amount));
    if (pay > 0) {
      settlements.push({
        fromUserId: debtors[i].userId,
        toUserId: creditors[j].userId,
        amount: pay,
      });
    }
    debtors[i].amount = round2(debtors[i].amount - pay);
    creditors[j].amount = round2(creditors[j].amount - pay);
    if (debtors[i].amount <= 0.009) i += 1;
    if (creditors[j].amount <= 0.009) j += 1;
  }

  return settlements;
};

const rebuildGroupLedger = async ({ groupId, session }) => {
  await GroupBalanceLedger.deleteMany({ groupId }).session(session);

  const [expenses, settlements] = await Promise.all([
    GroupExpense.find({ groupId, isDeleted: false }).sort({ occurredAt: 1, createdAt: 1 }).session(session),
    GroupSettlement.find({ groupId }).sort({ settledAt: 1, createdAt: 1 }).session(session),
  ]);

  for (const expense of expenses) {
    await applyExpenseToLedger({
      groupId,
      paidByUserId: expense.paidByUserId,
      splits: expense.splits || [],
      session,
    });
  }

  for (const settlement of settlements) {
    await applySettlementToLedger({
      groupId,
      paidByUserId: settlement.paidByUserId,
      receivedByUserId: settlement.receivedByUserId,
      amount: settlement.amount,
      session,
    });
  }
};

module.exports = {
  applyExpenseToLedger,
  applySettlementToLedger,
  getGroupBalances,
  simplifyDebts,
  rebuildGroupLedger,
};
