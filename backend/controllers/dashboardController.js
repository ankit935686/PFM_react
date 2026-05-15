const Income = require('../models/incomeModel');
const Expense = require('../models/expenseModel');
const Savings = require('../models/savingsModel');

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

const getPreviousMonth = (year, month) => {
  const date = new Date(year, month - 1, 1, 0, 0, 0, 0);
  date.setMonth(date.getMonth() - 1);

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const monthKeyFromParts = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

const getMonthStartFromOffset = (offsetMonths) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1, 0, 0, 0, 0);
};

const getLastMonthsWindow = (months) => {
  const safeMonths = Number.isFinite(Number(months)) ? Math.max(1, Math.min(24, Number(months))) : 6;
  const start = getMonthStartFromOffset(safeMonths - 1);

  return {
    start,
    months: safeMonths,
  };
};

const aggregateIncomeStats = async (userId, monthStart, monthEnd) => {
  const result = await Income.aggregate([
    { $match: { userId } },
    {
      $facet: {
        allTime: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
        monthly: [
          {
            $match: {
              date: { $gte: monthStart, $lt: monthEnd },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
      },
    },
  ]);

  const stats = result[0] || {};

  return {
    totalIncome: Number(stats.allTime?.[0]?.total || 0),
    monthlyIncome: Number(stats.monthly?.[0]?.total || 0),
  };
};

const aggregateExpenseStats = async (userId, monthStart, monthEnd) => {
  const result = await Expense.aggregate([
    { $match: { userId } },
    {
      $facet: {
        allTime: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
        monthly: [
          {
            $match: {
              date: { $gte: monthStart, $lt: monthEnd },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
      },
    },
  ]);

  const stats = result[0] || {};

  return {
    totalExpenses: Number(stats.allTime?.[0]?.total || 0),
    monthlyExpenses: Number(stats.monthly?.[0]?.total || 0),
  };
};

const getDashboardSummary = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month: selectedMonth, year: selectedYear } = parseMonthYear(req.query.month, req.query.year);
    const { monthStart, monthEnd } = getDateBoundsForMonth(selectedYear, selectedMonth);
    const previous = getPreviousMonth(selectedYear, selectedMonth);
    const previousBounds = getDateBoundsForMonth(previous.year, previous.month);

    const [incomeStats, expenseStats, previousIncomeStats, previousExpenseStats, savingsGoal] = await Promise.all([
      aggregateIncomeStats(userId, monthStart, monthEnd),
      aggregateExpenseStats(userId, monthStart, monthEnd),
      aggregateIncomeStats(userId, previousBounds.monthStart, previousBounds.monthEnd),
      aggregateExpenseStats(userId, previousBounds.monthStart, previousBounds.monthEnd),
      Savings.findOne({
        userId,
        month: selectedMonth,
        year: selectedYear,
      }),
    ]);

    const totalBalance = incomeStats.monthlyIncome - expenseStats.monthlyExpenses;
    const cumulativeBalance = incomeStats.totalIncome - expenseStats.totalExpenses;
    const monthlySavings = incomeStats.monthlyIncome - expenseStats.monthlyExpenses;
    const goalAmount = savingsGoal?.goalAmount || 0;
    const previousMonthlySavings = previousIncomeStats.monthlyIncome - previousExpenseStats.monthlyExpenses;

    let savingsPercentage = 0;
    if (goalAmount > 0) {
      savingsPercentage = (monthlySavings / goalAmount) * 100;
    } else if (incomeStats.monthlyIncome > 0) {
      savingsPercentage = (monthlySavings / incomeStats.monthlyIncome) * 100;
    }

    const progressStatus = monthlySavings >= goalAmount ? 'Achieved' : 'In Progress';
    const incomeChange = previousIncomeStats.monthlyIncome > 0
      ? ((incomeStats.monthlyIncome - previousIncomeStats.monthlyIncome) / previousIncomeStats.monthlyIncome) * 100
      : null;
    const expenseChange = previousExpenseStats.monthlyExpenses > 0
      ? ((expenseStats.monthlyExpenses - previousExpenseStats.monthlyExpenses) / previousExpenseStats.monthlyExpenses) * 100
      : null;
    const savingsChange = previousMonthlySavings !== 0
      ? ((monthlySavings - previousMonthlySavings) / Math.abs(previousMonthlySavings)) * 100
      : null;

    return res.status(200).json({
      summary: {
        totalBalance,
        monthlyIncome: incomeStats.monthlyIncome,
        monthlyExpenses: expenseStats.monthlyExpenses,
        totalSavings: monthlySavings,
        cumulativeBalance,
      },
      savings: {
        monthlySavings,
        goalAmount,
        savingsPercentage: Math.round(savingsPercentage * 100) / 100,
        progressStatus,
        displayText: `Saved ₹${monthlySavings.toLocaleString('en-IN')} out of ₹${goalAmount.toLocaleString('en-IN')} goal`,
      },
      comparison: {
        selected: {
          month: selectedMonth,
          year: selectedYear,
        },
        previous: {
          month: previous.month,
          year: previous.year,
          monthlyIncome: previousIncomeStats.monthlyIncome,
          monthlyExpenses: previousExpenseStats.monthlyExpenses,
          monthlySavings: previousMonthlySavings,
        },
        deltas: {
          incomeChange,
          expenseChange,
          savingsChange,
        },
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
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch dashboard summary',
      error: error.message,
    });
  }
};

const getExpenseCategoryTotals = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month, year } = parseMonthYear(req.query.month, req.query.year);
    const { monthStart, monthEnd } = getDateBoundsForMonth(year, month);

    const categories = await Expense.aggregate([
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
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: { $ifNull: ['$_id', 'Other'] },
          total: 1,
        },
      },
    ]);

    return res.status(200).json({
      categories,
      month: {
        month,
        year,
        start: monthStart.toISOString(),
        endExclusive: monthEnd.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch category-wise expenses',
      error: error.message,
    });
  }
};

const getMonthlyExpenseTotals = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month, year } = parseMonthYear(req.query.month, req.query.year);
    const requestedMonths = Number.isFinite(Number(req.query.months)) ? Number(req.query.months) : 6;
    const months = Math.max(1, Math.min(24, requestedMonths));
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    const start = new Date(year, month - months, 1, 0, 0, 0, 0);

    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          totalExpenses: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          monthKey: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          totalExpenses: 1,
        },
      },
    ]);

    return res.status(200).json({
      months,
      monthlyExpenses,
      month: {
        month,
        year,
        start: start.toISOString(),
        endExclusive: end.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch monthly expenses',
      error: error.message,
    });
  }
};

const getIncomeExpenseTrend = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { month, year } = parseMonthYear(req.query.month, req.query.year);
    const requestedMonths = Number.isFinite(Number(req.query.months)) ? Number(req.query.months) : 6;
    const months = Math.max(1, Math.min(24, requestedMonths));
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    const start = new Date(year, month - months, 1, 0, 0, 0, 0);

    const [incomeTrend, expenseTrend] = await Promise.all([
      Income.aggregate([
        {
          $match: {
            userId,
            date: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            totalIncome: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            userId,
            date: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            totalExpenses: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const trendMap = new Map();

    incomeTrend.forEach((row) => {
      const key = monthKeyFromParts(row._id.year, row._id.month);
      if (!trendMap.has(key)) {
        trendMap.set(key, { monthKey: key, totalIncome: 0, totalExpenses: 0 });
      }
      trendMap.get(key).totalIncome = Number(row.totalIncome || 0);
    });

    expenseTrend.forEach((row) => {
      const key = monthKeyFromParts(row._id.year, row._id.month);
      if (!trendMap.has(key)) {
        trendMap.set(key, { monthKey: key, totalIncome: 0, totalExpenses: 0 });
      }
      trendMap.get(key).totalExpenses = Number(row.totalExpenses || 0);
    });

    const trend = Array.from(trendMap.values()).sort((left, right) => left.monthKey.localeCompare(right.monthKey));

    return res.status(200).json({
      months,
      trend,
      month: {
        month,
        year,
        start: start.toISOString(),
        endExclusive: end.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch income-vs-expense trend',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
  getExpenseCategoryTotals,
  getMonthlyExpenseTotals,
  getIncomeExpenseTrend,
};
