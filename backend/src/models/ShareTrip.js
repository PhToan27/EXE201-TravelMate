const mongoose = require("mongoose");

const shareTripSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shareCode: {
      type: String,
      unique: true,
    },

    shareUrl: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    expiredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShareTrip", shareTripSchema);