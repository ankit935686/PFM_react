const express = require('express');
const {
  getProfileByFirebaseUid,
  upsertProfile,
} = require('../controllers/profileController');

const router = express.Router();

router.get('/:firebaseUid', getProfileByFirebaseUid);
router.post('/', upsertProfile);

module.exports = router;
