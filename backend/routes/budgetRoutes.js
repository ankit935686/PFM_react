const express = require('express');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const requireFirebaseUser = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireFirebaseUser);

router.post('/', createBudget);
router.get('/', getBudgets);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
