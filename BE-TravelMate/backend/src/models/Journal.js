const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    emotion: {
      type: String,
      default: '',
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    journalDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'tripjournals',
  }
);

module.exports = mongoose.model('Journal', journalSchema);
