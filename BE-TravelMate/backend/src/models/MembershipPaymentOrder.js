const mongoose = require('mongoose');

const membershipPaymentOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['PAYOS'],
      default: 'PAYOS',
    },
    packageType: {
      type: String,
      enum: ['premium'],
      default: 'premium',
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 10000,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    description: String,
    paymentLinkId: String,
    checkoutUrl: String,
    qrCode: String,
    deeplink: String,
    payosResponse: Object,
    webhookPayload: Object,
    paidAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipPaymentOrder', membershipPaymentOrderSchema);
