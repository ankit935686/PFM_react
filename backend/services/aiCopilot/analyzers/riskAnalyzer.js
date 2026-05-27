const { round2, safeDiv } = require('../analytics/helpers');

const getRiskAnalysis = ({ savings, budgets, spending }) => {
  const savingsRate = Number(savings?.savingsRate || 0);
  const budgetUtilization = Number(budgets?.utilizationPercent || 0);
  const concentration = Number(spending?.topCategories?.[0]?.total || 0);
  const totalExpenses = Number(spending?.totalExpenses || 0);
  const topCategoryShare = round2(safeDiv(concentration, totalExpenses || 1) * 100);

  const score = round2(
    Math.max(
      0,
      Math.min(
        100,
        100 - (savingsRate < 10 ? 25 : 10) - (budgetUtilization > 95 ? 30 : budgetUtilization > 80 ? 15 : 5) - (topCategoryShare > 40 ? 15 : 5)
      )
    )
  );

  return {
    riskScore: score,
    topCategorySharePercent: topCategoryShare,
    alerts: [
      ...(savingsRate < 10 ? ['Savings rate is below healthy threshold.'] : []),
      ...(budgetUtilization > 95 ? ['Budget utilization is critically high.'] : []),
      ...(topCategoryShare > 40 ? ['Spending concentration is high in top category.'] : []),
    ],
  };
};

module.exports = {
  getRiskAnalysis,
};
