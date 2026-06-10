const mongoose = require("mongoose");

const mapRouteSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    from: String,
    to: String,

    fromLocation: {
      lat: Number,
      lng: Number,
    },

    toLocation: {
      lat: Number,
      lng: Number,
    },

    distanceKm: Number,
    durationMinutes: Number,
    transport: String,
    estimatedCost: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("MapRoute", mapRouteSchema);