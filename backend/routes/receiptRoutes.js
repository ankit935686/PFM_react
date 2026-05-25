const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const requireFirebaseUser = require('../middleware/authMiddleware');

// Parse receipt image and optionally commit as expense(s)
router.post('/parse', requireFirebaseUser, receiptController.parseReceipt);

module.exports = router;
