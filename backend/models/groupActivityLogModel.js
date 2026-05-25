const mongoose = require('mongoose');

const groupActivityLogSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'group_created',
        'member_joined',
        'member_added',
        'member_removed',
        'expense_added',
        'expense_updated',
        'expense_deleted',
        'settlement_added',
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

groupActivityLogSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('GroupActivityLog', groupActivityLogSchema);

