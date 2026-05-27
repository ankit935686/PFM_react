const SavingsGoal = require('../../../models/savingsGoalModel');
const { round2, safeDiv } = require('../analytics/helpers');

const getGoalAnalysis = async (userId) => {
  const goals = await SavingsGoal.find({ userId }).lean();
  const formatted = goals.map((g) => {
    const target = Number(g.targetAmount || 0);
    const saved = Number(g.currentSavedAmount || 0);
    return {
      id: g._id,
      goalName: g.goalName,
      targetAmount: round2(target),
      currentSavedAmount: round2(saved),
      progressPercent: round2(safeDiv(saved, target || 1) * 100),
      remainingAmount: round2(Math.max(0, target - saved)),
      targetDate: g.targetDate,
      status: g.status,
    };
  });

  return {
    goalCount: formatted.length,
    activeGoals: formatted.filter((g) => g.status !== 'completed').length,
    goals: formatted,
  };
};

module.exports = {
  getGoalAnalysis,
};
