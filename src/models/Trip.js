const mongoose = require("mongoose");

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

    packingList: {
      selectedModes: {
        type: [String],
        default: [],
      },
      checkedItems: {
        type: Map,
        of: Boolean,
        default: {},
      },
      customItems: {
        type: [
          {
            id: String,
            name: String,
          },
        ],
        default: [],
      },
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
