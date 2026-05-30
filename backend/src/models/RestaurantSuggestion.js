const mongoose = require("mongoose");

const restaurantSuggestionSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    name: String,
    address: String,

    cuisineType: String,
    averagePricePerPerson: Number,
    rating: Number,
    imageUrl: String,

    location: {
      lat: Number,
      lng: Number,
    },

    nearByPlace: String,
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantSuggestion", restaurantSuggestionSchema);