const navigationService = require('../services/navigation.service');

const getNavigationToPlace = async (req, res) => {
  try {
    const data = await navigationService.getRouteToPlace({
      placeId: req.params.placeId,
      placeName: req.query.placeName,
      fromLat: req.query.fromLat,
      fromLng: req.query.fromLng,
      vehicle: req.query.vehicle,
    });

    return res.json({
      success: true,
      data,
    });
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
