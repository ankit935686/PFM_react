const User = require('../models/userModel');

const extractFirebaseUid = (req) => {
  return (
    req.headers['x-firebase-uid'] ||
    req.headers['x-user-id'] || 
    req.userId ||
    ''
  );
};

const requireFirebaseUser = async (req, res, next) => {
  try {
    const firebaseUid = extractFirebaseUid(req);
    const email = req.headers['x-firebase-email'] || req.headers['x-user-email'] || '';
    const displayName = req.headers['x-firebase-name'] || req.headers['x-firebase-display-name'] || '';

    if (!firebaseUid) {
      return res.status(401).json({
        message: 'Unauthorized: missing Firebase user identity.',
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          email,
          displayName,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    req.userId = user._id;
    req.user = {
      id: user._id,
      userId: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to authenticate user.',
      error: error.message,
    });
  }
};

module.exports = requireFirebaseUser;
