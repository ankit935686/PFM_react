const express = require('express');
const requireFirebaseUser = require('../middleware/authMiddleware');
const {
  getCalendarOverview,
  getDateDetails,
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  getNotificationFeed,
} = require('../controllers/calendarController');

const router = express.Router();

router.use(requireFirebaseUser);

router.get('/overview', getCalendarOverview);
router.get('/date/:date', getDateDetails);
router.get('/notifications', getNotificationFeed);

router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.put('/reminders/:reminderId', updateReminder);
router.delete('/reminders/:reminderId', deleteReminder);

module.exports = router;

