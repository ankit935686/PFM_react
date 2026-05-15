const Income = require('../models/incomeModel');
const Expense = require('../models/expenseModel');

const getUserIdFromRequest = (req) => {
  return req.userId || req.user?.userId || req.user?._id || req.user?.id || null;
};

const getDateBoundsForCurrentMonth = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return { monthStart, monthEnd };
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

    const { monthStart, monthEnd } = getDateBoundsForCurrentMonth();

    const [incomeStats, expenseStats] = await Promise.all([
      aggregateIncomeStats(userId, monthStart, monthEnd),
      aggregateExpenseStats(userId, monthStart, monthEnd),
    ]);

    const totalBalance = incomeStats.totalIncome - expenseStats.totalExpenses;
    const totalSavings = incomeStats.monthlyIncome - expenseStats.monthlyExpenses;

    return res.status(200).json({
      summary: {
        totalBalance,
        monthlyIncome: incomeStats.monthlyIncome,
        monthlyExpenses: expenseStats.monthlyExpenses,
        totalSavings,
      },
      month: {
        start: monthStart.toISOString(),
        endExclusive: monthEnd.toISOString(),
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

    const categories = await Expense.aggregate([
      { $match: { userId } },
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

    const { start, months } = getLastMonthsWindow(req.query.months);

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

    const { start, months } = getLastMonthsWindow(req.query.months);

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
