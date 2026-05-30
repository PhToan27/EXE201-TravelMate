const mongoose = require("mongoose");

const itineraryDaySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    dayNumber: Number,
    date: Date,
    title: String,

    totalDayCost: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItineraryDay", itineraryDaySchema);