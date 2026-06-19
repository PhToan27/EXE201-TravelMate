const placeService = require('../services/place.service');

/**
 * @desc    Get place details by name (caches and uses AI dynamically)
 * @route   GET /api/places/detail
 * @access  Private
 */
const getPlaceDetails = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu cung cấp tham số tên địa điểm (name)',
      });
    }

    const data = await placeService.getPlaceDetails(name);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Search places from MongoDB places collection
 * @route   GET /api/places/search
 * @access  Private
 */
const searchPlaces = async (req, res) => {
  try {
    const data = await placeService.searchPlaces({
      q: req.query.q,
      category: req.query.category,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPlaceDetails,
  searchPlaces,
};
