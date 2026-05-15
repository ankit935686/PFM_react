const express = require('express');
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const requireFirebaseUser = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireFirebaseUser);

router.post('/', createExpense);
router.get('/', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
