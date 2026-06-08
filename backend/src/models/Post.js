const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: 160,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 260,
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
      trim: true,
    },
    category: {
      type: String,
      default: 'Kinh nghiệm',
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imagePublicId: {
      type: String,
      trim: true,
    },
    readTime: {
      type: String,
      default: '5 phút đọc',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
    shares: {
      type: Number,
      default: 0,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    moderation: {
      status: {
        type: String,
        enum: ['passed', 'flagged', 'rejected', 'needs_review'],
        default: 'needs_review',
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
    },
    reported: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);
