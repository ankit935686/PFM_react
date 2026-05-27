const Budget = require('../../../models/budgetModel');
const Expense = require('../../../models/expenseModel');
const { round2, safeDiv } = require('../analytics/helpers');

const getBudgetAnalysis = async (userId, month, year) => {
  const [budgets, spentByCategory] = await Promise.all([
    Budget.find({ userId, month, year }).lean(),
    Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]),
  ]);

  const spentMap = new Map(spentByCategory.map((row) => [row._id, Number(row.spent || 0)]));
  const categories = budgets.map((b) => {
    const spent = round2(spentMap.get(b.category) || 0);
    const budgeted = round2(b.amount || 0);
    const utilization = round2(safeDiv(spent, budgeted || 1) * 100);
    return {
      category: b.category,
      budgeted,
      spent,
      remaining: round2(Math.max(0, budgeted - spent)),
      utilization,
      status: utilization >= 100 ? 'over' : utilization >= 85 ? 'warning' : 'safe',
    };
  });

  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);

  return {
    totalBudgeted: round2(totalBudgeted),
    totalSpent: round2(totalSpent),
    utilizationPercent: round2(safeDiv(totalSpent, totalBudgeted || 1) * 100),
    categories,
  };
};

module.exports = {
  getBudgetAnalysis,
};
