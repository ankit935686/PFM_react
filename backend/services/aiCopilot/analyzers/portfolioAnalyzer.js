const { round2 } = require('../analytics/helpers');

const getPortfolioAnalysis = ({ savings, goals, budgets }) => {
  const monthlySurplus = Number(savings?.monthlySurplus || 0);
  const investableMonthly = round2(Math.max(0, monthlySurplus * 0.4));
  const activeGoals = Number(goals?.activeGoals || 0);
  const budgetPressure = Number(budgets?.utilizationPercent || 0);

  const riskCapacity =
    monthlySurplus > 0 && budgetPressure < 80 ? 'moderate_to_high' : monthlySurplus > 0 ? 'moderate' : 'low';

  return {
    investableMonthly,
    riskCapacity,
    activeGoals,
    cashflowBufferMonths: monthlySurplus > 0 ? round2((savings?.totalIncome || 0) / Math.max(1, monthlySurplus)) : 0,
    recommendationHint:
      riskCapacity === 'low'
        ? 'Prioritize emergency buffer and debt control before aggressive investing.'
        : 'Diversified SIP/ETF approach can be considered with disciplined allocation.',
  };
};

module.exports = {
  getPortfolioAnalysis,
};
