const mongoose = require("mongoose");

const hotelSuggestionSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    name: String,
    address: String,
    area: String,

    pricePerNight: Number,
    estimatedTotalPrice: Number,

    rating: Number,
    imageUrl: String,

    location: {
      lat: Number,
      lng: Number,
    },

    distanceFromCenterKm: Number,
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("HotelSuggestion", hotelSuggestionSchema);