const Profile = require('../models/profileModel');

const isProfileComplete = (profile) => {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.fullName &&
      profile.country &&
      profile.currency &&
      Number(profile.monthlyIncome) > 0 &&
      Number(profile.monthlyBudget) > 0 &&
      Number(profile.savingsGoal) > 0
  );
};

const getProfileByFirebaseUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const profile = await Profile.findOne({ firebaseUid }).lean();

    if (!profile) {
      return res.status(200).json({
        exists: false,
        profile: null,
        complete: false,
      });
    }

    return res.status(200).json({
      exists: true,
      profile,
      complete: isProfileComplete(profile),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

const upsertProfile = async (req, res) => {
  try {
    const {
      firebaseUid,
      email,
      fullName,
      country,
      currency,
      monthlyIncome,
      monthlyBudget,
      savingsGoal,
      occupation,
      dateOfBirth,
    } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: 'firebaseUid and email are required.',
      });
    }

    const payload = {
      email,
      fullName,
      country,
      currency,
      monthlyIncome: Number(monthlyIncome || 0),
      monthlyBudget: Number(monthlyBudget || 0),
      savingsGoal: Number(savingsGoal || 0),
      occupation,
      dateOfBirth: dateOfBirth || null,
    };

    const profile = await Profile.findOneAndUpdate(
      { firebaseUid },
      { $set: payload },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.status(200).json({
      message: 'Profile saved successfully',
      profile,
      complete: isProfileComplete(profile),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save profile',
      error: error.message,
    });
  }
};

module.exports = {
  getProfileByFirebaseUid,
  upsertProfile,
};
