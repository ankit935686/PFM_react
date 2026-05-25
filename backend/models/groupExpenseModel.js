const mongoose = require('mongoose');

const expenseSplitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    percent: {
      type: Number,
      default: null,
      min: 0,
    },
    shares: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  { _id: false }
);

const groupExpenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paidByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR',
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Group Expense',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    receiptImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    receiptScan: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    occurredAt: {
      type: Date,
      required: true,
    },
    participantUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      default: [],
    },
    splits: {
      type: [expenseSplitSchema],
      default: [],
    },
    settlementStatus: {
      type: String,
      enum: ['pending', 'partial', 'settled'],
      default: 'pending',
    },
    linkedPersonalExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

groupExpenseSchema.index({ groupId: 1, occurredAt: -1 });
groupExpenseSchema.index({ groupId: 1, paidByUserId: 1, occurredAt: -1 });

module.exports = mongoose.model('GroupExpense', groupExpenseSchema);

