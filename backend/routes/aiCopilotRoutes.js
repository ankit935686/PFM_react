const express = require('express');
const requireFirebaseUser = require('../middleware/authMiddleware');
const { chatWithCopilot, getCopilotHealth } = require('../controllers/aiCopilotController');

const router = express.Router();

router.use(requireFirebaseUser);

router.post('/chat', chatWithCopilot);
router.get('/health', getCopilotHealth);

module.exports = router;
