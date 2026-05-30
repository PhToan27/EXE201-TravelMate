const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    itineraryDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItineraryDay",
      required: true,
    },

    time: String,
    title: String,
    description: String,

    category: {
      type: String,
      enum: ["FOOD", "PLACE", "HOTEL", "TRANSPORT", "REST", "SHOPPING", "OTHER"],
    },

    locationName: String,
    address: String,

    location: {
      lat: Number,
      lng: Number,
    },

    durationMinutes: Number,

    transport: {
      type: String,
      enum: ["WALKING", "BIKE", "CAR", "BUS", "TAXI", "GRAB", "OTHER"],
    },

    travelDistanceKm: Number,
    travelTimeMinutes: Number,
    transportCost: Number,

    estimatedCost: Number,

    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);