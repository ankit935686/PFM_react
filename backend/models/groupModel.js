const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    displayNameSnapshot: {
      type: String,
      trim: true,
      default: '',
    },
    emailSnapshot: {
      type: String,
      trim: true,
      default: '',
    },
    totalContributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSettledPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSettledReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: {
      type: [groupMemberSchema],
      default: [],
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ ownerUserId: 1, createdAt: -1 });
groupSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Group', groupSchema);

