const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      default: 'Điểm tham quan',
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    reviewsCount: {
      type: String,
      default: '100+',
    },
    duration: {
      type: String,
      default: '1-2 giờ',
    },
    difficulty: {
      type: String,
      default: 'Dễ',
    },
    introduction: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    openHours: {
      type: String,
      default: 'Mở cửa cả ngày',
    },
    ticketPrice: {
      type: String,
      default: 'Miễn phí',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    coordinates: {
      lat: {
        type: Number,
        default: 16.0544,
      },
      lng: {
        type: Number,
        default: 108.2022,
      },
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Place', placeSchema);
