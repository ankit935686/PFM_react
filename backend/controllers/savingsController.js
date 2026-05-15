const Income = require('../models/incomeModel');
const Expense = require('../models/expenseModel');
const Savings = require('../models/savingsModel');
const SavingsGoal = require('../models/savingsGoalModel');
const {
  buildSavingsSummary,
  buildSavingsHistory: buildSavingsHistoryRecords,
  buildSavingsGoalsOverview,
  enrichSavingsGoals,
  buildSavingsTrendData,
  buildSavingsMonthlyBreakdown,
  buildSavingsTimeline,
} = require('../services/savingsAnalyticsService');
const { buildSavingsInsights } = require('../services/groqSavingsService');

const getUserIdFromRequest = (req) => {
  return req.userId || req.user?.userId || req.user?._id || req.user?.id || null;
};

const getDateBoundsForCurrentMonth = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return { monthStart, monthEnd };
};

const getDateBoundsForMonth = (year, month) => {
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 1, 0, 0, 0, 0);

  return { monthStart, monthEnd };
};

const parseMonthYear = (monthValue, yearValue) => {
  const now = new Date();
  const month = Number(monthValue);
  const year = Number(yearValue);

  return {
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1,
    year: Number.isInteger(year) && year >= 2000 ? year : now.getFullYear(),
  };
};

const clampHistoryMonths = (value, fallback = 6) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(24, parsed));
};

// Calculate monthly savings = income - expenses
const calculateMonthlySavings = async (userId, monthStart, monthEnd) => {
  const incomeResult = await Income.aggregate([
    {
      $match: {
        userId,
        date: { $gte: monthStart, $lt: monthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const expenseResult = await Expense.aggregate([
    {
      $match: {
        userId,
        date: { $gte: monthStart, $lt: monthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totalIncome = Number(incomeResult[0]?.total || 0);
  const totalExpenses = Number(expenseResult[0]?.total || 0);
  const monthlySavings = totalIncome - totalExpenses;

  return {
    monthlySavings,
    totalIncome,
    totalExpenses,
  };
};

const buildSavingsHistory = async (userId, selectedYear, selectedMonth, monthsCount) => {
  const history = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const targetDate = new Date(selectedYear, selectedMonth - 1 - i, 1);
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();
    const { monthStart, monthEnd } = getDateBoundsForMonth(year, month);
    const { monthlySavings } = await calculateMonthlySavings(userId, monthStart, monthEnd);
    const savingsGoal = await Savings.findOne({ userId, month, year });

    history.push({
      month,
      year,
      monthlySavings,
      goalAmount: savingsGoal?.goalAmount || 0,
      displayMonth: `${month}/${year}`,
    });
  }

  return history;
};

const getGroqInsights = async ({
  monthlySavings,
  totalIncome,
  totalExpenses,
  goalAmount,
  savingsPercentage,
  progressStatus,
}) => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const payload = {
    model: 'llama3-8b-8192',
    temperature: 0.3,
    max_tokens: 220,
    messages: [
      {
        role: 'system',
        content: 'You are a concise personal finance coach. Provide short, actionable insights only.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          currency: 'INR',
          monthlySavings,
          totalIncome,
          totalExpenses,
          goalAmount,
          savingsPercentage,
          progressStatus,
          format: {
            summary: 'string',
            tips: 'array of 2-4 short strings',
            mood: 'ahead|on-track|behind',
          },
        }),
      },
    ],
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return null;
    }

    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || content,
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
        mood: parsed.mood || 'on-track',
      };
    } catch (parseError) {
      return {
        summary: content,
        tips: [],
        mood: 'on-track',
      };
    }
  } catch (error) {
    return null;
  }
};

// Get current month's savings tracker
const getSavingsTracker = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month: selectedMonth, year: selectedYear } = parseMonthYear(req.query.month, req.query.year);

    const { monthStart, monthEnd } = getDateBoundsForMonth(selectedYear, selectedMonth);

    // Get monthly savings (income - expenses)
    const { monthlySavings, totalIncome, totalExpenses } =
      await calculateMonthlySavings(userId, monthStart, monthEnd);

    // Get savings goal for current month
    const savingsGoal = await Savings.findOne({
      userId,
      month: selectedMonth,
      year: selectedYear,
    });

    const goalAmount = savingsGoal?.goalAmount || 0;

    // Calculate savings percentage
    let savingsPercentage = 0;
    if (goalAmount > 0) {
      savingsPercentage = (monthlySavings / goalAmount) * 100;
    } else if (totalIncome > 0) {
      savingsPercentage = (monthlySavings / totalIncome) * 100;
    }

    // Determine progress status
    const progressStatus = monthlySavings >= goalAmount ? 'Achieved' : 'In Progress';

    return res.status(200).json({
      savingsTracker: {
        monthlySavings,
        goalAmount,
        savingsPercentage: Math.round(savingsPercentage * 100) / 100,
        progressStatus,
        totalIncome,
        totalExpenses,
        displayText: `Saved ₹${monthlySavings.toLocaleString('en-IN')} out of ₹${goalAmount.toLocaleString('en-IN')} goal`,
      },
      month: {
        current: selectedMonth,
        year: selectedYear,
        start: monthStart.toISOString(),
        endExclusive: monthEnd.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch savings tracker',
      error: error.message,
    });
  }
};

// Set or update savings goal for a specific month
const setSavingsGoal = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { goalAmount, month, year, notes } = req.body;

    if (!goalAmount || goalAmount < 0) {
      return res.status(400).json({
        message: 'Goal amount is required and must be non-negative',
      });
    }

    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({
        message: 'Month must be between 1 and 12',
      });
    }

    const savingsGoal = await Savings.findOneAndUpdate(
      {
        userId,
        month: targetMonth,
        year: targetYear,
      },
      {
        goalAmount,
        notes: notes || '',
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: 'Savings goal updated successfully',
      savingsGoal,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update savings goal',
      error: error.message,
    });
  }
};

// Get savings history for last N months
const getSavingsHistory = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const months = req.query.months || 6;
    const safeMonths = Math.max(1, Math.min(24, parseInt(months)));

    const now = new Date();
    const history = [];

    for (let i = safeMonths - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const { monthStart, monthEnd } = getDateBoundsForMonth(year, month);

      const { monthlySavings } = await calculateMonthlySavings(userId, monthStart, monthEnd);

      const savingsGoal = await Savings.findOne({
        userId,
        month,
        year,
      });

      history.push({
        month,
        year,
        monthlySavings,
        goalAmount: savingsGoal?.goalAmount || 0,
        displayMonth: `${month}/${year}`,
      });
    }

    return res.status(200).json({
      savingsHistory: history,
      period: {
        months: safeMonths,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch savings history',
      error: error.message,
    });
  }
};

// Get detailed savings section data for a specific month
const getSavingsDetailsLegacy = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month: selectedMonth, year: selectedYear } = parseMonthYear(req.query.month, req.query.year);
    const historyMonths = clampHistoryMonths(req.query.historyMonths, 6);
    const { monthStart, monthEnd } = getDateBoundsForMonth(selectedYear, selectedMonth);

    const { monthlySavings, totalIncome, totalExpenses } =
      await calculateMonthlySavings(userId, monthStart, monthEnd);

    const savingsGoal = await Savings.findOne({
      userId,
      month: selectedMonth,
      year: selectedYear,
    });

    const goalAmount = savingsGoal?.goalAmount || 0;

    let savingsPercentage = 0;
    if (goalAmount > 0) {
      savingsPercentage = (monthlySavings / goalAmount) * 100;
    } else if (totalIncome > 0) {
      savingsPercentage = (monthlySavings / totalIncome) * 100;
    }

    const progressStatus = monthlySavings >= goalAmount ? 'Achieved' : 'In Progress';
    const history = await buildSavingsHistory(userId, selectedYear, selectedMonth, historyMonths);
    const insights = await getGroqInsights({
      monthlySavings,
      totalIncome,
      totalExpenses,
      goalAmount,
      savingsPercentage: Math.round(savingsPercentage * 100) / 100,
      progressStatus,
    });

    return res.status(200).json({
      savingsTracker: {
        monthlySavings,
        goalAmount,
        savingsPercentage: Math.round(savingsPercentage * 100) / 100,
        progressStatus,
        totalIncome,
        totalExpenses,
        displayText: `Saved ₹${monthlySavings.toLocaleString('en-IN')} out of ₹${goalAmount.toLocaleString('en-IN')} goal`,
      },
      savingsGoal,
      history,
      insights,
      month: {
        current: selectedMonth,
        year: selectedYear,
        start: monthStart.toISOString(),
        endExclusive: monthEnd.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch savings details',
      error: error.message,
    });
  }
};

// Delete savings goal
const deleteSavingsGoal = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        message: 'Month and year are required',
      });
    }

    const result = await Savings.findOneAndDelete({
      userId,
      month,
      year,
    });

    if (!result) {
      return res.status(404).json({
        message: 'Savings goal not found',
      });
    }

    return res.status(200).json({
      message: 'Savings goal deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete savings goal',
      error: error.message,
    });
  }
};

const normalizeSavingsGoal = (goal) => {
  const goalObject = goal.toObject ? goal.toObject() : goal;
  const remainingAmount = Math.max(0, Number(goalObject.targetAmount || 0) - Number(goalObject.currentSavedAmount || 0));
  const progressPercent = goalObject.targetAmount > 0
    ? Math.min(100, Math.round((Number(goalObject.currentSavedAmount || 0) / Number(goalObject.targetAmount || 0)) * 100))
    : 0;
  const targetDate = goalObject.targetDate ? new Date(goalObject.targetDate) : null;
  const now = new Date();
  const monthsRemaining = targetDate
    ? Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()))
    : 0;
  const monthlyRequired = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;

  return {
    ...goalObject,
    remainingAmount,
    progressPercent,
    monthsRemaining,
    monthlyRequired,
    isCompleted: goalObject.status === 'completed' || progressPercent >= 100,
    contributionCount: Array.isArray(goalObject.contributions) ? goalObject.contributions.length : 0,
  };
};

const getSavingsGoals = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const statusFilter = req.query.status;
    const query = { userId };

    if (statusFilter && ['active', 'completed', 'paused'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const goals = await SavingsGoal.find(query).sort({ status: 1, targetDate: 1, createdAt: -1 });

    return res.status(200).json({
      goals: goals.map(normalizeSavingsGoal),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch savings goals',
      error: error.message,
    });
  }
};

const createSavingsGoal = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { goalName, targetAmount, currentSavedAmount, targetDate, icon, category, notes } = req.body;

    if (!goalName || !goalName.trim()) {
      return res.status(400).json({
        message: 'Goal name is required',
      });
    }

    if (targetAmount === undefined || Number(targetAmount) < 0) {
      return res.status(400).json({
        message: 'Target amount is required and must be non-negative',
      });
    }

    if (!targetDate) {
      return res.status(400).json({
        message: 'Target date is required',
      });
    }

    const parsedTargetDate = new Date(targetDate);
    if (Number.isNaN(parsedTargetDate.getTime())) {
      return res.status(400).json({
        message: 'Target date must be valid',
      });
    }

    const goal = await SavingsGoal.create({
      userId,
      goalName: goalName.trim(),
      targetAmount: Number(targetAmount),
      currentSavedAmount: Math.max(0, Number(currentSavedAmount || 0)),
      targetDate: parsedTargetDate,
      icon: icon || 'target',
      category: category || 'General',
      notes: notes || '',
      status: Number(currentSavedAmount || 0) >= Number(targetAmount) ? 'completed' : 'active',
      completedAt: Number(currentSavedAmount || 0) >= Number(targetAmount) ? new Date() : null,
    });

    return res.status(201).json({
      message: 'Savings goal created successfully',
      goal: normalizeSavingsGoal(goal),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create savings goal',
      error: error.message,
    });
  }
};

const updateSavingsGoalEntry = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { goalId } = req.params;
    const updates = req.body || {};

    const goal = await SavingsGoal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({
        message: 'Savings goal not found',
      });
    }

    if (updates.goalName !== undefined) {
      goal.goalName = String(updates.goalName).trim();
    }
    if (updates.targetAmount !== undefined) {
      goal.targetAmount = Number(updates.targetAmount);
    }
    if (updates.currentSavedAmount !== undefined) {
      goal.currentSavedAmount = Math.max(0, Number(updates.currentSavedAmount));
    }
    if (updates.targetDate !== undefined) {
      const parsedTargetDate = new Date(updates.targetDate);
      if (Number.isNaN(parsedTargetDate.getTime())) {
        return res.status(400).json({
          message: 'Target date must be valid',
        });
      }
      goal.targetDate = parsedTargetDate;
    }
    if (updates.icon !== undefined) {
      goal.icon = updates.icon || 'target';
    }
    if (updates.category !== undefined) {
      goal.category = updates.category || 'General';
    }
    if (updates.notes !== undefined) {
      goal.notes = updates.notes || '';
    }
    if (updates.status !== undefined && ['active', 'completed', 'paused'].includes(updates.status)) {
      goal.status = updates.status;
      goal.completedAt = updates.status === 'completed' ? goal.completedAt || new Date() : null;
    }

    if (goal.currentSavedAmount >= goal.targetAmount && goal.status !== 'paused') {
      goal.status = 'completed';
      goal.completedAt = goal.completedAt || new Date();
    }

    await goal.save();

    return res.status(200).json({
      message: 'Savings goal updated successfully',
      goal: normalizeSavingsGoal(goal),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update savings goal',
      error: error.message,
    });
  }
};

const addSavingsGoalContribution = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { goalId } = req.params;
    const { amount, note } = req.body;

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        message: 'Contribution amount must be greater than zero',
      });
    }

    const goal = await SavingsGoal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({
        message: 'Savings goal not found',
      });
    }

    goal.currentSavedAmount += Number(amount);
    goal.contributions.push({
      amount: Number(amount),
      note: note || '',
      contributedAt: new Date(),
    });

    if (goal.currentSavedAmount >= goal.targetAmount) {
      goal.status = 'completed';
      goal.completedAt = goal.completedAt || new Date();
    }

    await goal.save();

    return res.status(200).json({
      message: 'Contribution added successfully',
      goal: normalizeSavingsGoal(goal),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to add contribution',
      error: error.message,
    });
  }
};

const deleteSavingsGoalEntry = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { goalId } = req.params;
    const result = await SavingsGoal.findOneAndDelete({ _id: goalId, userId });

    if (!result) {
      return res.status(404).json({
        message: 'Savings goal not found',
      });
    }

    return res.status(200).json({
      message: 'Savings goal deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete savings goal',
      error: error.message,
    });
  }
};

const getSavingsDetails = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month: selectedMonth, year: selectedYear } = parseMonthYear(req.query.month, req.query.year);
    const historyMonths = clampHistoryMonths(req.query.historyMonths, 12);

    const summary = await buildSavingsSummary(userId, selectedYear, selectedMonth);
    const history = await buildSavingsHistoryRecords(userId, selectedYear, selectedMonth, historyMonths);
    const monthlyTrend = buildSavingsTrendData(
      history,
      `${summary.month.selected.year}-${String(summary.month.selected.month).padStart(2, '0')}`
    );
    const goalsOverview = await buildSavingsGoalsOverview(userId);
    const enrichedGoals = enrichSavingsGoals(
      goalsOverview.goals,
      summary.metrics.current.monthlySavings,
      selectedYear,
      selectedMonth
    ).sort((left, right) => {
      if (left.status === right.status) {
        return new Date(left.targetDate) - new Date(right.targetDate);
      }
      return left.status === 'completed' ? 1 : -1;
    });
    const breakdown = await buildSavingsMonthlyBreakdown(userId, selectedYear, selectedMonth);
    const timeline = buildSavingsTimeline(history, goalsOverview);
    const insights = await buildSavingsInsights({
      summary: {
        ...summary.summary,
        monthLabel: `${selectedMonth}/${selectedYear}`,
      },
      breakdown,
      goals: enrichedGoals,
      history,
      monthlyTrend,
    });

    return res.status(200).json({
      savingsTracker: {
        monthlySavings: summary.summary.currentMonthSavings,
        goalAmount: summary.summary.currentMonthGoalAmount,
        savingsPercentage: summary.summary.savingsRatePercentage,
        progressStatus: summary.summary.currentMonthSavings >= summary.summary.currentMonthGoalAmount ? 'Achieved' : 'In Progress',
        totalIncome: summary.metrics.current.totalIncome,
        totalExpenses: summary.metrics.current.totalExpenses,
        displayText: `Saved ₹${summary.summary.currentMonthSavings.toLocaleString('en-IN')} out of ₹${summary.summary.currentMonthGoalAmount.toLocaleString('en-IN')} goal`,
      },
      summary: {
        ...summary.summary,
      },
      goals: {
        allGoals: enrichedGoals,
        activeGoals: enrichedGoals.filter((goal) => goal.status !== 'completed'),
        completedGoals: enrichedGoals.filter((goal) => goal.status === 'completed'),
        totalGoals: enrichedGoals.length,
      },
      breakdown,
      history,
      timeline,
      trend: monthlyTrend,
      insights,
      month: summary.month,
      comparison: {
        current: summary.metrics.current,
        previous: summary.metrics.previous,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch savings details',
      error: error.message,
    });
  }
};

module.exports = {
  getSavingsTracker,
  setSavingsGoal,
  getSavingsHistory,
  getSavingsDetails,
  deleteSavingsGoal,
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoalEntry,
  addSavingsGoalContribution,
  deleteSavingsGoalEntry,
};
