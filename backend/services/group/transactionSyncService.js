const Expense = require('../../models/expenseModel');
const Income = require('../../models/incomeModel');

const syncGroupExpenseToPersonal = async ({
  userId,
  amount,
  category = 'Group Expense',
  occurredAt,
  groupName,
  expenseTitle,
  session,
}) => {
  const expense = await Expense.create(
    [
      {
        userId,
        amount: Number(amount),
        category,
        date: occurredAt || new Date(),
        paymentMethod: 'UPI',
        notes: `[Group:${groupName}] ${expenseTitle}`,
      },
    ],
    { session }
  );
  return expense[0];
};

const syncSettlementToPersonal = async ({
  payerUserId,
  receiverUserId,
  amount,
  settledAt,
  groupName,
  note,
  session,
}) => {
  const payerExpense = await Expense.create(
    [
      {
        userId: payerUserId,
        amount: Number(amount),
        category: 'Group Settlement',
        date: settledAt || new Date(),
        paymentMethod: 'UPI',
        notes: `[Group:${groupName}] Settlement paid${note ? ` - ${note}` : ''}`,
      },
    ],
    { session }
  );

  const receiverIncome = await Income.create(
    [
      {
        userId: receiverUserId,
        amount: Number(amount),
        source: 'Group Settlement',
        date: settledAt || new Date(),
        notes: `[Group:${groupName}] Settlement received${note ? ` - ${note}` : ''}`,
      },
    ],
    { session }
  );

  return {
    payerExpense: payerExpense[0],
    receiverIncome: receiverIncome[0],
  };
};

module.exports = {
  syncGroupExpenseToPersonal,
  syncSettlementToPersonal,
};

