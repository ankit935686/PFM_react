const express = require('express');
const {
  createIncome,
  getIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomeController');
const requireFirebaseUser = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireFirebaseUser);

router.post('/', createIncome);
router.get('/', getIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
