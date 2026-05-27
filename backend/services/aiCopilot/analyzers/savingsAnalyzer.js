const Income = require('../../../models/incomeModel');
const Expense = require('../../../models/expenseModel');
const Savings = require('../../../models/savingsModel');
const { getDateRangeForMonths, round2, safeDiv } = require('../analytics/helpers');

const getSavingsAnalysis = async (userId, months = 6) => {
  const { start, end } = getDateRangeForMonths(months);
  const [incomeRows, expenseRows, latestGoal] = await Promise.all([
    Income.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Savings.findOne({ userId }).sort({ year: -1, month: -1 }).lean(),
  ]);

  const totalIncome = round2(incomeRows[0]?.total || 0);
  const totalExpenses = round2(expenseRows[0]?.total || 0);
  const monthlySurplus = round2(totalIncome - totalExpenses);

  return {
    totalIncome,
    totalExpenses,
    monthlySurplus,
    savingsRate: round2(safeDiv(monthlySurplus, totalIncome) * 100),
    monthlySavingsGoal: round2(latestGoal?.goalAmount || 0),
  };
};

module.exports = {
  getSavingsAnalysis,
};
