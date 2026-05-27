const { round2 } = require('../analytics/helpers');

const getInvestmentAnalysis = ({ portfolio, risk }) => {
  const riskScore = Number(risk?.riskScore || 0);
  const capacity = portfolio?.riskCapacity || 'moderate';

  const modelAllocation =
    capacity === 'low'
      ? { equity: 30, debt: 60, gold: 10 }
      : capacity === 'moderate_to_high'
      ? { equity: 65, debt: 25, gold: 10 }
      : { equity: 50, debt: 40, gold: 10 };

  return {
    inferredRiskScore: round2(riskScore),
    inferredRiskCapacity: capacity,
    suggestedAllocation: modelAllocation,
    monthlyDeployable: round2(portfolio?.investableMonthly || 0),
  };
};

module.exports = {
  getInvestmentAnalysis,
};
