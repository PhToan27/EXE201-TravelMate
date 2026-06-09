const mongoose = require('mongoose');

const itineraryTemplateSchema = new mongoose.Schema(
  {
    destinationKey: {
      type: String,
      required: true,
      index: true,
    },
    travelStyleKey: {
      type: String,
      default: 'GENERAL',
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    title: String,
    result: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

itineraryTemplateSchema.index(
  { destinationKey: 1, travelStyleKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('ItineraryTemplate', itineraryTemplateSchema);
