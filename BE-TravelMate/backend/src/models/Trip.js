const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  day: Number,
  time: String,
  location: String,
  description: String,
  cost: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ["FOOD", "PLACE", "HOTEL", "TRANSPORT", "REST", "SHOPPING", "OTHER"],
    default: "OTHER",
  },
  transport: {
    type: String,
    enum: ["WALKING", "BIKE", "CAR", "BUS", "TAXI", "GRAB", "OTHER"],
  },
  durationMinutes: Number,
});

const hotelRecommendationSchema = new mongoose.Schema({
  name: String,
  address: String,
  description: String,
  estimatedCostPerNight: {
    type: Number,
    default: 0,
  },
  rating: Number,
  area: String,
});

const restaurantRecommendationSchema = new mongoose.Schema({
  name: String,
  address: String,
  cuisineType: String,
  averagePricePerPerson: {
    type: Number,
    default: 0,
  },
  rating: Number,
  description: String,
});

const budgetBreakdownSchema = new mongoose.Schema({
  accommodation: {
    type: Number,
    default: 0,
  },
  foodAndBeverage: {
    type: Number,
    default: 0,
  },
  activitiesAndEntranceFees: {
    type: Number,
    default: 0,
  },
  transportation: {
    type: Number,
    default: 0,
  },
  unforeseenExpenses: {
    type: Number,
    default: 0,
  },
});

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: String,
    destination: {
      type: String,
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: Number,
    totalPeople: {
      type: Number,
      default: 1,
    },

    budget: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "VND",
    },

    travelStyle: {
      type: String,
      default: "CHILL",
    },

    interests: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["DRAFT", "SAVED", "DELETED"],
      default: "SAVED",
    },

    activities: {
      type: [activitySchema],
      default: [],
    },

    hotelRecommendation: hotelRecommendationSchema,
    restaurantRecommendations: {
      type: [restaurantRecommendationSchema],
      default: [],
    },

    budgetBreakdown: budgetBreakdownSchema,

    totalEstimatedCost: {
      type: Number,
      default: 0,
    },
    remainingBudget: {
      type: Number,
      default: 0,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    shareCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);