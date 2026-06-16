const Place = require('../models/Place');
const navigationService = require('../services/navigation.service');

const getNavigationToPlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { fromLat, fromLng, vehicle = 'motorcycle' } = req.query;

    if (!fromLat || !fromLng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fromLat and fromLng query parameters',
      });
    }

    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    const data = await navigationService.getNavigationToPlace({
      place,
      origin: {
        latitude: Number(fromLat),
        longitude: Number(fromLng),
      },
      vehicle,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const statusCode = error.statusCode || error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.messages ||
      error.message ||
      'Khong the lay du lieu dan duong';

    console.error('Navigation route error:', {
      statusCode,
      message,
      placeId: req.params.placeId,
      placeName: req.query.placeName,
      fromLat: req.query.fromLat,
      fromLng: req.query.fromLng,
      vehicle: req.query.vehicle,
    });

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  getNavigationToPlace,
};
