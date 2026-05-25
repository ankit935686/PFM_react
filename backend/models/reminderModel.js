const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
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
    remindAt: {
      type: Date,
      required: true,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

reminderSchema.index({ userId: 1, remindAt: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);

