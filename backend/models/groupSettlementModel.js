const mongoose = require('mongoose');

const groupSettlementSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    paidByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receivedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    settledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    linkedPayerExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    linkedReceiverIncomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Income',
      default: null,
    },
  },
  { timestamps: true }
);

groupSettlementSchema.index({ groupId: 1, settledAt: -1 });

module.exports = mongoose.model('GroupSettlement', groupSettlementSchema);

