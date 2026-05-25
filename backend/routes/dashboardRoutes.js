const express = require('express');
const {
	getDashboardSummary,
	getExpenseCategoryTotals,
	getMonthlyExpenseTotals,
	getIncomeExpenseTrend,
	getDashboardInsights,
} = require('../controllers/dashboardController');
const requireFirebaseUser = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireFirebaseUser);
router.get('/summary', getDashboardSummary);
router.get('/analytics/expense-categories', getExpenseCategoryTotals);
router.get('/analytics/monthly-expenses', getMonthlyExpenseTotals);
router.get('/analytics/income-expense-trend', getIncomeExpenseTrend);
router.get('/insights', getDashboardInsights);

module.exports = router;
