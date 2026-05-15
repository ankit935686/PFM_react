const express = require('express');
const {
  getSavingsTracker,
  setSavingsGoal,
  getSavingsHistory,
  getSavingsDetails,
  deleteSavingsGoal,
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoalEntry,
  addSavingsGoalContribution,
  deleteSavingsGoalEntry,
} = require('../controllers/savingsController');
const requireFirebaseUser = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireFirebaseUser);

router.get('/tracker', getSavingsTracker);
router.get('/details', getSavingsDetails);
router.get('/history', getSavingsHistory);
router.post('/goal', setSavingsGoal);
router.delete('/goal', deleteSavingsGoal);
router.get('/goals', getSavingsGoals);
router.post('/goals', createSavingsGoal);
router.put('/goals/:goalId', updateSavingsGoalEntry);
router.post('/goals/:goalId/contributions', addSavingsGoalContribution);
router.delete('/goals/:goalId', deleteSavingsGoalEntry);

module.exports = router;
