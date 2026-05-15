const mongoose = require('mongoose');

const savingsGoalContributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Contribution amount cannot be negative'],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    contributedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: [0, 'Target amount cannot be negative'],
    },
    currentSavedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Saved amount cannot be negative'],
    },
    targetDate: {
      type: Date,
      required: true,
    },
    icon: {
      type: String,
      trim: true,
      default: 'target',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    contributions: {
      type: [savingsGoalContributionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

savingsGoalSchema.index({ userId: 1, status: 1, targetDate: 1 });
savingsGoalSchema.index({ userId: 1, goalName: 1 });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
