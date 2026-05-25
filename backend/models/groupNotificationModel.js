const mongoose = require('mongoose');

const groupNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
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
        'you_owe',
        'you_are_owed',
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
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

groupNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('GroupNotification', groupNotificationSchema);

