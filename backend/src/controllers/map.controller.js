const mapService = require('../services/map.service');

/**
 * @desc    Geocode an address to latitude and longitude
 * @route   GET /api/map/geocode
 * @access  Private
 */
const getLocationCoordinates = async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ success: false, message: 'Please provide an address parameter' });
    }

    const data = await mapService.getCoordinates(address);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Calculate distance and duration between origin and destination
 * @route   GET /api/map/distance
 * @access  Private
 */
const getRouteDetails = async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide originLat, originLng, destLat, and destLng query parameters',
      });
    }

    const origin = { lat: parseFloat(originLat), lng: parseFloat(originLng) };
    const destination = { lat: parseFloat(destLat), lng: parseFloat(destLng) };

    const data = await mapService.calculateDistance(origin, destination);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getLocationCoordinates,
  getRouteDetails,
};
