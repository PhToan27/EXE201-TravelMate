const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema(
  {
    premiumIndividualPrice: {
      type: Number,
      required: true,
      default: 99000,
    },
    premiumFamilyPrice: {
      type: Number,
      required: true,
      default: 249000,
    },
    isNotificationEnabled: {
      type: Boolean,
      default: true,
    },
    isDailyReportEnabled: {
      type: Boolean,
      default: false,
    },
    emailReportRecipient: {
      type: String,
      default: 'admin@travelmate.com',
      trim: true,
      lowercase: true,
    },
    notificationFrequency: {
      type: String,
      enum: ['Ngay lập tức', 'Hàng giờ', 'Hàng ngày'],
      default: 'Ngay lập tức',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdminSetting', adminSettingSchema);
