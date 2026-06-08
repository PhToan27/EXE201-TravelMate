const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: ['auto_pending', 'auto_rejected', 'admin_approved', 'admin_rejected', 'image_review_required'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'none',
    },
    reasons: {
      type: [String],
      default: [],
    },
    provider: {
      type: String,
      default: 'basic-rule',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
