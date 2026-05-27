const { round2 } = require('../analytics/helpers');

const getFinancialHealth = ({ savings, budgets, risk }) => {
  const savingsRate = Number(savings?.savingsRate || 0);
  const budgetUtilization = Number(budgets?.utilizationPercent || 0);
  const riskScore = Number(risk?.riskScore || 0);

  const healthScore = round2(
    Math.max(0, Math.min(100, savingsRate * 2.5 + (100 - Math.min(100, budgetUtilization)) * 0.35 + riskScore * 0.4))
  );

  const band = healthScore >= 75 ? 'strong' : healthScore >= 55 ? 'stable' : healthScore >= 35 ? 'warning' : 'critical';

  return {
    healthScore,
    band,
    summary:
      band === 'strong'
        ? 'Financial health is strong with sustainable cashflow.'
        : band === 'stable'
        ? 'Financial health is stable but has room for optimization.'
        : band === 'warning'
        ? 'Financial health needs correction in savings and budget control.'
        : 'Financial stress signals are high and need immediate action.',
  };
};

module.exports = {
  getFinancialHealth,
};
