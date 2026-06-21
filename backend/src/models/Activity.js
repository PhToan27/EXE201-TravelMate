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
    endTime: String,
    title: String,
    description: String,

    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
    },

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
      enum: ["WALKING", "BIKE", "MOTORBIKE","CAR", "BUS", "TAXI", "GRAB", "OTHER"],
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
