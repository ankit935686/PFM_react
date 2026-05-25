const express = require('express');
const requireFirebaseUser = require('../middleware/authMiddleware');
const {
  createGroup,
  listGroups,
  getGroupById,
  joinGroup,
  addMember,
  removeMember,
  addExpense,
  editExpense,
  listExpenses,
  deleteExpense,
  settlePayment,
  getBalances,
  getSimplifiedDebts,
  getGroupActivity,
  getGroupSettlements,
  getGroupNotifications,
  getMyNotifications,
  markNotificationRead,
  getAnalytics,
} = require('../controllers/groupController');

const router = express.Router();

router.use(requireFirebaseUser);

router.post('/', createGroup);
router.get('/', listGroups);
router.post('/join', joinGroup);
router.get('/notifications', getMyNotifications);
router.put('/notifications/:notificationId/read', markNotificationRead);

router.get('/:groupId', getGroupById);
router.post('/:groupId/members', addMember);
router.delete('/:groupId/members/:memberUserId', removeMember);

router.post('/:groupId/expenses', addExpense);
router.put('/:groupId/expenses/:expenseId', editExpense);
router.get('/:groupId/expenses', listExpenses);
router.delete('/:groupId/expenses/:expenseId', deleteExpense);

router.post('/:groupId/settlements', settlePayment);
router.get('/:groupId/settlements', getGroupSettlements);
router.get('/:groupId/balances', getBalances);
router.get('/:groupId/debts/simplified', getSimplifiedDebts);

router.get('/:groupId/activity', getGroupActivity);
router.get('/:groupId/notifications', getGroupNotifications);
router.get('/:groupId/analytics', getAnalytics);

module.exports = router;
