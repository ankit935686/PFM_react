const Income = require('../../../models/incomeModel');
const Expense = require('../../../models/expenseModel');
const { getSpendingAnalysis } = require('../analyzers/spendingAnalyzer');
const { getSavingsAnalysis } = require('../analyzers/savingsAnalyzer');
const { getBudgetAnalysis } = require('../analyzers/budgetAnalyzer');
const { getGoalAnalysis } = require('../analyzers/goalAnalyzer');
const { getSplitwiseAnalysis } = require('../analyzers/splitwiseAnalyzer');
const { getPortfolioAnalysis } = require('../analyzers/portfolioAnalyzer');
const { getInvestmentAnalysis } = require('../analyzers/investmentAnalyzer');
const { getRiskAnalysis } = require('../analyzers/riskAnalyzer');
const { getFinancialHealth } = require('../analyzers/financialHealthEngine');
const { getDateRangeForMonths, round2 } = require('./helpers');

const getCoreMetrics = async (userId, months = 6) => {
  const { start, end } = getDateRangeForMonths(months);
  const [incomeRows, expenseRows] = await Promise.all([
    Income.aggregate([{ $match: { userId, date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Expense.aggregate([{ $match: { userId, date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  return {
    totalIncome: round2(incomeRows[0]?.total || 0),
    totalExpenses: round2(expenseRows[0]?.total || 0),
  };
};

const buildAnalyticsPacket = async ({ userId, plan }) => {
  if (!plan.useAnalytics) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const analytics = {};
  if (plan.sections.includes('core')) analytics.core = await getCoreMetrics(userId, plan.months);
  if (plan.sections.includes('spending')) analytics.spending = await getSpendingAnalysis(userId, plan.months);
  if (plan.sections.includes('savings')) analytics.savings = await getSavingsAnalysis(userId, plan.months);
  if (plan.sections.includes('budgets')) analytics.budgets = await getBudgetAnalysis(userId, month, year);
  if (plan.sections.includes('goals')) analytics.goals = await getGoalAnalysis(userId);
  if (plan.sections.includes('splitwise')) analytics.splitwise = await getSplitwiseAnalysis(userId);

  analytics.risk = getRiskAnalysis({
    savings: analytics.savings || {},
    budgets: analytics.budgets || {},
    spending: analytics.spending || {},
  });
  analytics.financialHealth = getFinancialHealth({
    savings: analytics.savings || {},
    budgets: analytics.budgets || {},
    risk: analytics.risk || {},
  });

  if (plan.usePortfolio) {
    analytics.portfolio = getPortfolioAnalysis({
      savings: analytics.savings || {},
      goals: analytics.goals || {},
      budgets: analytics.budgets || {},
    });
    analytics.investment = getInvestmentAnalysis({
      portfolio: analytics.portfolio,
      risk: analytics.risk,
    });
  }

  return analytics;
};

module.exports = {
  buildAnalyticsPacket,
};
