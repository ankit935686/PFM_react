const Income = require('../models/incomeModel');
const Expense = require('../models/expenseModel');

const getUserIdFromRequest = (req) => {
  return req.userId || req.user?.userId || req.user?._id || req.user?.id || null;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

// Get complete transaction history with filters
const getTransactionHistory = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const {
      type = 'All', // All, Income, Expense
      category = 'All',
      search = '',
      startDate,
      endDate,
      sortBy = 'date', // date, amount
      sortOrder = 'desc', // asc, desc
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const query = { userId };
    if (startDate) {
      query.date = { $gte: new Date(`${startDate}T00:00:00`) };
    }
    if (endDate) {
      if (!query.date) query.date = {};
      query.date.$lte = new Date(`${endDate}T23:59:59`);
    }

    // Build aggregation pipeline
    const incomeQuery = { ...query };
    const expenseQuery = { ...query };

    if (category !== 'All') {
      incomeQuery.source = category;
      expenseQuery.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      incomeQuery.$or = [{ source: searchRegex }, { notes: searchRegex }];
      expenseQuery.$or = [{ category: searchRegex }, { notes: searchRegex }];
    }

    let incomeData = [];
    let expenseData = [];

    if (type === 'All' || type === 'Income') {
      incomeData = await Income.find(incomeQuery).lean();
    }

    if (type === 'All' || type === 'Expense') {
      expenseData = await Expense.find(expenseQuery).lean();
    }

    // Normalize data
    const normalized = [
      ...incomeData.map((item) => ({
        _id: item._id,
        type: 'Income',
        amount: item.amount,
        category: item.source,
        date: item.date,
        notes: item.notes || '',
        paymentMethod: item.paymentMethod || 'N/A',
      })),
      ...expenseData.map((item) => ({
        _id: item._id,
        type: 'Expense',
        amount: item.amount,
        category: item.category,
        date: item.date,
        notes: item.notes || '',
        paymentMethod: item.paymentMethod || 'N/A',
      })),
    ];

    // Sort
    const sortOptions = {
      date: (a, b) => (sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)),
      amount: (a, b) => (sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount),
    };

    const sortFunc = sortOptions[sortBy] || sortOptions.date;
    normalized.sort(sortFunc);

    // Calculate statistics
    const totalIncome = normalized
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalExpense = normalized
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const categoryStats = {};
    normalized.forEach((t) => {
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === 'Income') {
        categoryStats[t.category].income += Number(t.amount) || 0;
      } else {
        categoryStats[t.category].expense += Number(t.amount) || 0;
      }
    });

    // Paginate
    const total = normalized.length;
    const transactions = normalized.slice(skip, skip + limitNum);

    return res.status(200).json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      statistics: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        transactionCount: total,
        incomeCount: normalized.filter((t) => t.type === 'Income').length,
        expenseCount: normalized.filter((t) => t.type === 'Expense').length,
        averageIncome: totalIncome > 0 ? Math.round(totalIncome / Math.max(1, normalized.filter((t) => t.type === 'Income').length) * 100) / 100 : 0,
        averageExpense: totalExpense > 0 ? Math.round(totalExpense / Math.max(1, normalized.filter((t) => t.type === 'Expense').length) * 100) / 100 : 0,
        categoryBreakdown: categoryStats,
      },
      filters: {
        type,
        category,
        search,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch transaction history',
      error: error.message,
    });
  }
};

// Get transaction statistics
const getTransactionStatistics = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { months = 6 } = req.query;
    const safeMonths = Math.max(1, Math.min(24, parseInt(months) || 6));

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - safeMonths);

    // Get monthly data
    const incomeByMonth = await Income.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const expenseByMonth = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Category-wise income
    const incomeByCategory = await Income.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Category-wise expense
    const expenseByCategory = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return res.status(200).json({
      statistics: {
        incomeByMonth: incomeByMonth.map((item) => ({
          month: item._id.month,
          year: item._id.year,
          total: item.total,
          count: item.count,
        })),
        expenseByMonth: expenseByMonth.map((item) => ({
          month: item._id.month,
          year: item._id.year,
          total: item.total,
          count: item.count,
        })),
        incomeByCategory: incomeByCategory.map((item) => ({
          category: item._id,
          total: item.total,
          count: item.count,
        })),
        expenseByCategory: expenseByCategory.map((item) => ({
          category: item._id,
          total: item.total,
          count: item.count,
        })),
      },
      period: {
        months: safeMonths,
        startDate: startDate.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch transaction statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getTransactionHistory,
  getTransactionStatistics,
};
