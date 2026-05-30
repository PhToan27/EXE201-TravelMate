const mongoose = require("mongoose");

const budgetBreakdownSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    accommodation: {
      amount: Number,
      percent: Number,
    },

    food: {
      amount: Number,
      percent: Number,
    },

    transport: {
      amount: Number,
      percent: Number,
    },

    activities: {
      amount: Number,
      percent: Number,
    },

    shopping: {
      amount: Number,
      percent: Number,
    },

    other: {
      amount: Number,
      percent: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BudgetBreakdown", budgetBreakdownSchema);