const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['FOOD', 'STAY', 'TRANSPORT', 'VISIT', 'SHOPPING', 'OTHER'],
      default: 'OTHER',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    billImageUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
