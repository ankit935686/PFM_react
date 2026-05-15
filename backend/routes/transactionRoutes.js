const express = require('express');
const {
  getTransactionHistory,
  getTransactionStatistics,
} = require('../controllers/transactionController');
const requireFirebaseUser = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireFirebaseUser);

router.get('/history', getTransactionHistory);
router.get('/statistics', getTransactionStatistics);

module.exports = router;
