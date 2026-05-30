const mongoose = require("mongoose");

const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },

    input: {
      destination: String,
      startDate: Date,
      totalDays: Number,
      totalPeople: Number,
      budget: Number,
      travelStyle: String,
      interests: [String],
    },

    prompt: String,
    response: Object,

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    errorMessage: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiLog", aiLogSchema);