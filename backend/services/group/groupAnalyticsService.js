const GroupExpense = require('../../models/groupExpenseModel');
const GroupSettlement = require('../../models/groupSettlementModel');
const GroupBalanceLedger = require('../../models/groupBalanceLedgerModel');

const getGroupAnalytics = async ({ groupId, userId }) => {
  const [expenses, settlements, ledger] = await Promise.all([
    GroupExpense.find({ groupId, isDeleted: false }).lean(),
    GroupSettlement.find({ groupId }).lean(),
    GroupBalanceLedger.find({ groupId }).lean(),
  ]);

  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const settlementTotal = settlements.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  let youOwe = 0;
  let youAreOwed = 0;
  for (const row of ledger) {
    if (String(row.fromUserId) === String(userId)) youOwe += Number(row.amount || 0);
    if (String(row.toUserId) === String(userId)) youAreOwed += Number(row.amount || 0);
  }

  const categoryMap = {};
  for (const expense of expenses) {
    const key = expense.category || 'Other';
    categoryMap[key] = (categoryMap[key] || 0) + Number(expense.amount || 0);
  }

  return {
    totalSpent,
    settlementTotal,
    yourBalance: Number((youAreOwed - youOwe).toFixed(2)),
    whoOwesYou: Number(youAreOwed.toFixed(2)),
    whomYouOwe: Number(youOwe.toFixed(2)),
    expenseCount: expenses.length,
    settlementCount: settlements.length,
    categories: Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount),
  };
};

module.exports = {
  getGroupAnalytics,
};

