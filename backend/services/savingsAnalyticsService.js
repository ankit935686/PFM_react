const Income = require('../models/incomeModel');
const Expense = require('../models/expenseModel');
const Savings = require('../models/savingsModel');
const SavingsGoal = require('../models/savingsGoalModel');

const getDateBoundsForMonth = (year, month) => {
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 1, 0, 0, 0, 0);

  return { monthStart, monthEnd };
};

const getMonthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

const getPreviousMonth = (year, month) => {
  const date = new Date(year, month - 1, 1, 0, 0, 0, 0);
  date.setMonth(date.getMonth() - 1);

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const getMonthWindow = (selectedYear, selectedMonth, monthsCount = 12) => {
  const safeMonths = Math.max(2, Math.min(24, Number(monthsCount) || 12));
  const months = [];

  for (let index = safeMonths - 1; index >= 0; index--) {
    const date = new Date(selectedYear, selectedMonth - 1 - index, 1, 0, 0, 0, 0);
    months.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });
  }

  return months;
};

const calculateMonthlySavings = async (userId, monthStart, monthEnd) => {
  const [incomeResult, expenseResult, incomeByCategoryResult, expenseByCategoryResult] = await Promise.all([
    Income.aggregate([
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
    ]),
    Expense.aggregate([
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
    ]),
    Income.aggregate([
      {
        $match: {
          userId,
          date: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 3,
      },
    ]),
    Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 5,
      },
    ]),
  ]);

  const totalIncome = Number(incomeResult[0]?.total || 0);
  const totalExpenses = Number(expenseResult[0]?.total || 0);
  const monthlySavings = totalIncome - totalExpenses;

  return {
    monthlySavings,
    totalIncome,
    totalExpenses,
    incomeByCategory: incomeByCategoryResult.map((item) => ({
      name: item._id || 'Other',
      amount: Number(item.total || 0),
    })),
    expenseByCategory: expenseByCategoryResult.map((item) => ({
      name: item._id || 'Other',
      amount: Number(item.total || 0),
    })),
  };
};

const buildSavingsHistory = async (userId, selectedYear, selectedMonth, monthsCount = 12) => {
  const months = getMonthWindow(selectedYear, selectedMonth, monthsCount);
  const history = [];

  for (const { month, year } of months) {
    const { monthStart, monthEnd } = getDateBoundsForMonth(year, month);
    const metrics = await calculateMonthlySavings(userId, monthStart, monthEnd);
    const savingsGoal = await Savings.findOne({ userId, month, year });

    history.push({
      month,
      year,
      monthKey: getMonthKey(year, month),
      date: new Date(year, month - 1, 1).toISOString(),
      monthlySavings: metrics.monthlySavings,
      totalIncome: metrics.totalIncome,
      totalExpenses: metrics.totalExpenses,
      goalAmount: savingsGoal?.goalAmount || 0,
      progressStatus: metrics.monthlySavings >= (savingsGoal?.goalAmount || 0) ? 'Achieved' : 'In Progress',
      completedGoals: [],
    });
  }

  return history;
};

const buildSavingsGoalsOverview = async (userId) => {
  const goals = await SavingsGoal.find({ userId }).sort({ status: 1, targetDate: 1, createdAt: -1 });

  const activeGoals = goals.filter((goal) => goal.status !== 'completed');
  const completedGoals = goals.filter((goal) => goal.status === 'completed');
  const totalTargetAmount = goals.reduce((sum, goal) => sum + Number(goal.targetAmount || 0), 0);
  const totalSavedAmount = goals.reduce((sum, goal) => sum + Number(goal.currentSavedAmount || 0), 0);

  return {
    goals,
    activeGoals,
    completedGoals,
    totalGoals: goals.length,
    totalTargetAmount,
    totalSavedAmount,
  };
};

const enrichSavingsGoals = (goals, monthlySavings, selectedYear, selectedMonth) => {
  const currentMonthDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);

  return goals.map((goal) => {
    const remaining = Math.max(0, Number(goal.targetAmount || 0) - Number(goal.currentSavedAmount || 0));
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
    const monthsRemaining = targetDate
      ? Math.max(
          1,
          (targetDate.getFullYear() - currentMonthDate.getFullYear()) * 12 +
            (targetDate.getMonth() - currentMonthDate.getMonth())
        )
      : 1;
    const monthlyRequired = remaining > 0 ? remaining / monthsRemaining : 0;
    const estimatedCompletionMonths = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
    const progressPercent =
      goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentSavedAmount / goal.targetAmount) * 100)) : 0;

    return {
      ...goal.toObject?.() || goal,
      remainingAmount: remaining,
      monthsRemaining,
      monthlyRequired,
      estimatedCompletionMonths,
      progressPercent,
      isOnTrack: monthlyRequired === 0 || monthlyRequired <= monthlySavings || progressPercent >= 100,
    };
  });
};

const buildSavingsSummary = async (userId, selectedYear, selectedMonth) => {
  const { monthStart, monthEnd } = getDateBoundsForMonth(selectedYear, selectedMonth);
  const previous = getPreviousMonth(selectedYear, selectedMonth);
  const previousBounds = getDateBoundsForMonth(previous.year, previous.month);

  const [currentMetrics, previousMetrics, allGoalsOverview] = await Promise.all([
    calculateMonthlySavings(userId, monthStart, monthEnd),
    calculateMonthlySavings(userId, previousBounds.monthStart, previousBounds.monthEnd),
    buildSavingsGoalsOverview(userId),
  ]);

  const monthlySavings = currentMetrics.monthlySavings;
  const previousMonthlySavings = previousMetrics.monthlySavings;
  const [allTimeIncomeResult, allTimeExpenseResult, currentGoalResult] = await Promise.all([
    Income.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    Expense.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    Savings.findOne({ userId, month: selectedMonth, year: selectedYear }),
  ]);

  const totalLifetimeSavings = Number(allTimeIncomeResult[0]?.total || 0) - Number(allTimeExpenseResult[0]?.total || 0);
  const currentMonthGoalAmount = currentGoalResult?.goalAmount || 0;
  const savingsRatePercentage = currentMetrics.totalIncome > 0 ? (monthlySavings / currentMetrics.totalIncome) * 100 : 0;
  const monthOverMonthGrowth = previousMonthlySavings !== 0
    ? ((monthlySavings - previousMonthlySavings) / Math.abs(previousMonthlySavings)) * 100
    : null;

  return {
    summary: {
      totalLifetimeSavings,
      currentMonthSavings: monthlySavings,
      savingsRatePercentage: Math.round(savingsRatePercentage * 100) / 100,
      totalActiveGoals: allGoalsOverview.activeGoals.length,
      monthOverMonthGrowth: monthOverMonthGrowth === null ? null : Math.round(monthOverMonthGrowth * 100) / 100,
      currentMonthGoalAmount,
    },
    month: {
      selected: {
        month: selectedMonth,
        year: selectedYear,
        start: monthStart.toISOString(),
        endExclusive: monthEnd.toISOString(),
      },
      previous: {
        month: previous.month,
        year: previous.year,
        start: previousBounds.monthStart.toISOString(),
        endExclusive: previousBounds.monthEnd.toISOString(),
      },
    },
    metrics: {
      current: currentMetrics,
      previous: previousMetrics,
    },
    goals: allGoalsOverview,
  };
};

const buildSavingsTrendData = (history, selectedMonthLabel) => {
  return history.map((item) => ({
    monthKey: item.monthKey,
    label: new Date(item.year, item.month - 1, 1).toLocaleString('en-US', { month: 'short' }),
    savings: Number(item.monthlySavings || 0),
    income: Number(item.totalIncome || 0),
    expenses: Number(item.totalExpenses || 0),
    goalAmount: Number(item.goalAmount || 0),
    selected: item.monthKey === selectedMonthLabel,
  }));
};

const buildSavingsMonthlyBreakdown = async (userId, selectedYear, selectedMonth) => {
  const { monthStart, monthEnd } = getDateBoundsForMonth(selectedYear, selectedMonth);
  const { monthlySavings, totalIncome, totalExpenses, expenseByCategory } = await calculateMonthlySavings(
    userId,
    monthStart,
    monthEnd
  );

  const previous = getPreviousMonth(selectedYear, selectedMonth);
  const previousBounds = getDateBoundsForMonth(previous.year, previous.month);
  const previousMetrics = await calculateMonthlySavings(userId, previousBounds.monthStart, previousBounds.monthEnd);

  const highestSpendingCategory = expenseByCategory[0] || null;
  const categoryReductionTarget = highestSpendingCategory
    ? Math.round(Number(highestSpendingCategory.amount || 0) * 0.1)
    : 0;

  return {
    income: totalIncome,
    expenses: totalExpenses,
    netSavings: monthlySavings,
    savingsRatePercentage: totalIncome > 0 ? Math.round((monthlySavings / totalIncome) * 10000) / 100 : 0,
    highestSpendingCategory,
    categoryReductionTarget,
    previousMonth: {
      month: previous.month,
      year: previous.year,
      income: previousMetrics.totalIncome,
      expenses: previousMetrics.totalExpenses,
      savings: previousMetrics.monthlySavings,
    },
  };
};

const buildSavingsTimeline = (history, goals) => {
  const completedGoalEvents = goals.completedGoals.map((goal) => ({
    type: 'goal-completed',
    date: goal.completedAt || goal.updatedAt || goal.createdAt,
    label: goal.goalName,
    amount: Number(goal.targetAmount || 0),
  }));

  return [...history, ...completedGoalEvents]
    .map((entry) => ({
      ...entry,
      sortDate: entry.date || entry.completedAt || entry.updatedAt || entry.createdAt || new Date(),
    }))
    .sort((left, right) => new Date(right.sortDate) - new Date(left.sortDate));
};

module.exports = {
  getDateBoundsForMonth,
  getMonthKey,
  getPreviousMonth,
  getMonthWindow,
  calculateMonthlySavings,
  buildSavingsHistory,
  buildSavingsGoalsOverview,
  enrichSavingsGoals,
  buildSavingsSummary,
  buildSavingsTrendData,
  buildSavingsMonthlyBreakdown,
  buildSavingsTimeline,
};
