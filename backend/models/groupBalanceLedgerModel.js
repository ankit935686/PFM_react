const mongoose = require('mongoose');

const groupBalanceLedgerSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    toUserId: {
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
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

groupBalanceLedgerSchema.index({ groupId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });

module.exports = mongoose.model('GroupBalanceLedger', groupBalanceLedgerSchema);

