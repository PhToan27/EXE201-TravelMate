const mongoose = require('mongoose');

const itineraryCacheSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    destination: String,
    durationDays: Number,
    budget: Number,
    preferences: [String],
    options: Object,
    result: {
      type: Object,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ItineraryCache', itineraryCacheSchema);