const Expense = require('../../../models/expenseModel');
const { getDateRangeForMonths, round2 } = require('../analytics/helpers');

const getSpendingAnalysis = async (userId, months = 6) => {
  const { start, end } = getDateRangeForMonths(months);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  const [totals, categories, currentMonthCategories] = await Promise.all([
    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
    Expense.aggregate([
      { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const monthlyTop = currentMonthCategories[0]
    ? {
        category: currentMonthCategories[0]._id || 'Other',
        total: round2(currentMonthCategories[0].total || 0),
        count: Number(currentMonthCategories[0].count || 0),
      }
    : null;

  return {
    totalExpenses: round2(totals[0]?.total || 0),
    topCategories: categories.map((c) => ({
      category: c._id || 'Other',
      total: round2(c.total || 0),
      count: Number(c.count || 0),
    })),
    currentMonthTopCategory: monthlyTop,
    currentMonthCategories: currentMonthCategories.map((c) => ({
      category: c._id || 'Other',
      total: round2(c.total || 0),
      count: Number(c.count || 0),
    })),
  };
};

module.exports = {
  getSpendingAnalysis,
};
