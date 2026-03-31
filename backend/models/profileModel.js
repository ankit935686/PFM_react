const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'JPY', 'AUD', 'CAD'],
      default: 'INR',
    },
    monthlyIncome: {
      type: Number,
      min: 0,
      default: 0,
    },
    monthlyBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    savingsGoal: {
      type: Number,
      min: 0,
      default: 0,
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);
