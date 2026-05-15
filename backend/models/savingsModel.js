const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goalAmount: {
      type: Number,
      required: true,
      min: [0, 'Goal amount cannot be negative'],
    },
    month: {
      type: Number,
      required: true,
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: true,
      min: [2000, 'Year must be valid'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

savingsSchema.index({ userId: 1, year: -1, month: -1 });

module.exports = mongoose.model('Savings', savingsSchema);
