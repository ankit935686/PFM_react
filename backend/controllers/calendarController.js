const mongoose = require('mongoose');
const Expense = require('../models/expenseModel');
const Income = require('../models/incomeModel');
const SavingsGoal = require('../models/savingsGoalModel');
const Reminder = require('../models/reminderModel');

const getUserIdFromRequest = (req) => req.userId || req.user?.userId || req.user?._id || req.user?.id || null;

const toDateOnlyKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getMonthBounds = (year, month) => {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const now = new Date();
  const safeYear = Number.isInteger(parsedYear) && parsedYear >= 2000 ? parsedYear : now.getFullYear();
  const safeMonth = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1;

  const start = new Date(safeYear, safeMonth - 1, 1, 0, 0, 0, 0);
  const end = new Date(safeYear, safeMonth, 1, 0, 0, 0, 0);
  return { start, end, year: safeYear, month: safeMonth };
};

const getDayBounds = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''))) {
    return null;
  }
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const getCalendarOverview = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { start, end, year, month } = getMonthBounds(req.query.year, req.query.month);

    const [expenses, income, goalsByTarget, goalsByCreated, reminders] = await Promise.all([
      Expense.find({ userId, date: { $gte: start, $lt: end } }).select('_id amount category date notes').lean(),
      Income.find({ userId, date: { $gte: start, $lt: end } }).select('_id amount source date notes').lean(),
      SavingsGoal.find({ userId, targetDate: { $gte: start, $lt: end } }).select('_id goalName targetDate targetAmount status').lean(),
      SavingsGoal.find({ userId, createdAt: { $gte: start, $lt: end } }).select('_id goalName createdAt targetDate targetAmount status').lean(),
      Reminder.find({ userId, remindAt: { $gte: start, $lt: end } }).select('_id title description remindAt isCompleted').lean(),
    ]);

    const dayMap = {};
    const ensure = (key) => {
      if (!dayMap[key]) {
        dayMap[key] = {
          date: key,
          counts: { expense: 0, income: 0, reminders: 0, goalStart: 0, goalEnd: 0 },
          totals: { expenseAmount: 0, incomeAmount: 0 },
          hasEvents: false,
        };
      }
      return dayMap[key];
    };

    expenses.forEach((item) => {
      const key = toDateOnlyKey(item.date);
      if (!key) return;
      const day = ensure(key);
      day.counts.expense += 1;
      day.totals.expenseAmount += Number(item.amount || 0);
      day.hasEvents = true;
    });

    income.forEach((item) => {
      const key = toDateOnlyKey(item.date);
      if (!key) return;
      const day = ensure(key);
      day.counts.income += 1;
      day.totals.incomeAmount += Number(item.amount || 0);
      day.hasEvents = true;
    });

    reminders.forEach((item) => {
      const key = toDateOnlyKey(item.remindAt);
      if (!key) return;
      const day = ensure(key);
      day.counts.reminders += 1;
      day.hasEvents = true;
    });

    goalsByCreated.forEach((goal) => {
      const key = toDateOnlyKey(goal.createdAt);
      if (!key) return;
      const day = ensure(key);
      day.counts.goalStart += 1;
      day.hasEvents = true;
    });

    goalsByTarget.forEach((goal) => {
      const key = toDateOnlyKey(goal.targetDate);
      if (!key) return;
      const day = ensure(key);
      day.counts.goalEnd += 1;
      day.hasEvents = true;
    });

    return res.status(200).json({
      month: { year, month, start: start.toISOString(), endExclusive: end.toISOString() },
      days: Object.values(dayMap).sort((a, b) => new Date(a.date) - new Date(b.date)),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch calendar overview', error: error.message });
  }
};

const getDateDetails = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const dateStr = req.params.date;
    const bounds = getDayBounds(dateStr);
    if (!bounds) return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format.' });

    const { start, end } = bounds;

    const [expenses, income, reminders, goalStarts, goalEnds] = await Promise.all([
      Expense.find({ userId, date: { $gte: start, $lt: end } }).sort({ date: -1, createdAt: -1 }).lean(),
      Income.find({ userId, date: { $gte: start, $lt: end } }).sort({ date: -1, createdAt: -1 }).lean(),
      Reminder.find({ userId, remindAt: { $gte: start, $lt: end } }).sort({ remindAt: 1 }).lean(),
      SavingsGoal.find({ userId, createdAt: { $gte: start, $lt: end } }).sort({ createdAt: 1 }).lean(),
      SavingsGoal.find({ userId, targetDate: { $gte: start, $lt: end } }).sort({ targetDate: 1 }).lean(),
    ]);

    return res.status(200).json({
      date: dateStr,
      counts: {
        expenses: expenses.length,
        income: income.length,
        reminders: reminders.length,
        goalStarts: goalStarts.length,
        goalEnds: goalEnds.length,
      },
      totals: {
        expenseAmount: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        incomeAmount: income.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      },
      expenses,
      income,
      reminders,
      goalStarts,
      goalEnds,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch date details', error: error.message });
  }
};

const createReminder = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, description, remindAt } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Reminder title is required.' });
    }
    if (!remindAt) {
      return res.status(400).json({ message: 'remindAt is required.' });
    }

    const parsedRemindAt = new Date(remindAt);
    if (Number.isNaN(parsedRemindAt.getTime())) {
      return res.status(400).json({ message: 'remindAt must be a valid date.' });
    }

    const reminder = await Reminder.create({
      userId,
      title: String(title).trim(),
      description: String(description || '').trim(),
      remindAt: parsedRemindAt,
    });

    return res.status(201).json({ message: 'Reminder created successfully', reminder });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create reminder', error: error.message });
  }
};

const getReminders = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const query = { userId };
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const includeCompleted = String(req.query.includeCompleted || 'false').toLowerCase() === 'true';

    if (!includeCompleted) {
      query.isCompleted = false;
    }

    if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
      return res.status(400).json({ message: 'Invalid startDate or endDate format.' });
    }

    if (startDate || endDate) {
      query.remindAt = {};
      if (startDate) query.remindAt.$gte = startDate;
      if (endDate) query.remindAt.$lte = endDate;
    }

    const reminders = await Reminder.find(query).sort({ remindAt: 1, createdAt: -1 }).lean();
    return res.status(200).json({ reminders });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reminders', error: error.message });
  }
};

const updateReminder = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { reminderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reminderId)) {
      return res.status(400).json({ message: 'Invalid reminder id.' });
    }

    const updates = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Reminder title cannot be empty.' });
      updates.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      updates.description = String(req.body.description || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'remindAt')) {
      const parsed = new Date(req.body.remindAt);
      if (Number.isNaN(parsed.getTime())) return res.status(400).json({ message: 'remindAt must be valid.' });
      updates.remindAt = parsed;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'isCompleted')) {
      updates.isCompleted = Boolean(req.body.isCompleted);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const reminder = await Reminder.findOneAndUpdate(
      { _id: reminderId, userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!reminder) return res.status(404).json({ message: 'Reminder not found.' });
    return res.status(200).json({ message: 'Reminder updated successfully', reminder });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update reminder', error: error.message });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { reminderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reminderId)) {
      return res.status(400).json({ message: 'Invalid reminder id.' });
    }

    const deleted = await Reminder.findOneAndDelete({ _id: reminderId, userId }).lean();
    if (!deleted) return res.status(404).json({ message: 'Reminder not found.' });
    return res.status(200).json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete reminder', error: error.message });
  }
};

const getNotificationFeed = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const daysAhead = Math.max(0, Math.min(30, Number.parseInt(req.query.daysAhead || '3', 10) || 3));
    const now = new Date();
    const from = req.query.from ? new Date(req.query.from) : now;
    const to = req.query.to ? new Date(req.query.to) : new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ message: 'Invalid from/to date format.' });
    }

    const [reminders, goalEnds] = await Promise.all([
      Reminder.find({
        userId,
        isCompleted: false,
        remindAt: { $gte: from, $lte: to },
      })
        .sort({ remindAt: 1 })
        .lean(),
      SavingsGoal.find({
        userId,
        status: { $ne: 'completed' },
        targetDate: { $gte: from, $lte: to },
      })
        .sort({ targetDate: 1 })
        .lean(),
    ]);

    const notifications = [
      ...reminders.map((item) => ({
        id: `reminder-${item._id}`,
        type: 'reminder_due',
        title: item.title,
        description: item.description || 'Reminder due',
        date: item.remindAt,
        severity: new Date(item.remindAt) <= now ? 'critical' : 'warning',
      })),
      ...goalEnds.map((goal) => ({
        id: `goal-end-${goal._id}`,
        type: 'goal_target_date',
        title: `Goal target: ${goal.goalName}`,
        description: `Target amount ${Number(goal.targetAmount || 0)}`,
        date: goal.targetDate,
        severity: new Date(goal.targetDate) <= now ? 'critical' : 'info',
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({
      window: { from: from.toISOString(), to: to.toISOString(), daysAhead },
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notification feed', error: error.message });
  }
};

module.exports = {
  getCalendarOverview,
  getDateDetails,
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  getNotificationFeed,
};

