const placeService = require('../services/place.service');
const Place = require('../models/Place');

// Haversine formula to calculate distance in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

const getPlaceType = (place) => {
  const name = String(place.name || '').toLowerCase();
  const category = String(place.category || '').toLowerCase();
  const address = String(place.address || '').toLowerCase();
  const text = `${name} ${category} ${address}`;

  if (
    text.includes('khach san') ||
    text.includes('hotel') ||
    text.includes('homestay') ||
    text.includes('resort') ||
    text.includes('nha nghi') ||
    text.includes('villa') ||
    category === 'khách sạn'
  ) {
    return 'HOTEL';
  }

  if (
    text.includes('nha hang') ||
    text.includes('quan an') ||
    text.includes('quan com') ||
    text.includes('cafe') ||
    text.includes('ca phe') ||
    text.includes('quan lau') ||
    text.includes('quan nuong') ||
    text.includes('tiem an') ||
    text.includes('am thuc') ||
    text.includes('an uong') ||
    text.includes('hai san') ||
    category === 'ẩm thực'
  ) {
    return 'RESTAURANT';
  }

  return 'ATTRACTION';
};

const normalizeText = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .normalize('NFC');
};

const isDestinationMatch = (place, destination) => {
  if (!destination) return false;
  const destNorm = normalizeText(destination);
  const addressNorm = normalizeText(place.address || '');
  const nameNorm = normalizeText(place.name || '');

  // Direct matches
  if (addressNorm.includes(destNorm) || nameNorm.includes(destNorm)) return true;

  // Key city mappings
  const mapping = {
    'ha noi': ['hà nội', 'hoàn kiếm', 'ba đình', 'tây hồ', 'cầu giấy', 'hai bà trưng', 'đống đa'],
    'da nang': ['đà nẵng', 'hải châu', 'sơn trà', 'ngũ hành sơn', 'liên chiểu', 'thanh khê'],
    'ho chi minh': ['hồ chí minh', 'sài gòn', 'quận 1', 'quận 3', 'quận 5', 'quận 10', 'bến thành'],
    'sai gon': ['hồ chí minh', 'sài gòn', 'quận 1', 'quận 3', 'quận 5', 'quận 10', 'bến thành'],
    'da lat': ['đà lạt', 'lâm đồng'],
    'phu quoc': ['phú quốc', 'kiên giang'],
    'nha trang': ['nha trang', 'khánh hòa'],
    'hoi an': ['hội an', 'quảng nam'],
    'sa pa': ['sa pa', 'lào cai', 'sapa'],
    'hue': ['huế', 'thừa thiên huế']
  };

  for (const [key, aliases] of Object.entries(mapping)) {
    if (destNorm.includes(key) || key.includes(destNorm)) {
      return aliases.some(alias => addressNorm.includes(alias) || nameNorm.includes(alias));
    }
  }

  return false;
};

/**
 * @desc    Get nearby places from MongoDB coordinates
 * @route   GET /api/places/nearby
 * @access  Private
 */
const getNearbyPlaces = async (req, res) => {
  try {
    const { lat, lng, excludeName, limit = 5, type, destination } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu tham số tọa độ (lat, lng)',
      });
    }

    const currentLat = Number(lat);
    const currentLng = Number(lng);

    let allPlaces = await Place.find({}).lean();

    if (type) {
      const targetType = String(type).toUpperCase();
      allPlaces = allPlaces.filter(p => getPlaceType(p) === targetType);
    }

    if (destination) {
      const destFiltered = allPlaces.filter(p => isDestinationMatch(p, destination));
      if (destFiltered.length > 0) {
        allPlaces = destFiltered;
      }
    }

    const nearby = allPlaces
      .filter((p) => p.name !== excludeName)
      .map((p) => {
        const placeLat = p.coordinates?.lat || 16.0544;
        const placeLng = p.coordinates?.lng || 108.2022;
        const distance = getDistance(currentLat, currentLng, placeLat, placeLng);
        return {
          ...p,
          distance: Number(distance.toFixed(2)),
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Number(limit));

    return res.json({
      success: true,
      data: nearby,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Search places by name or address from database
 * @route   GET /api/places/search
 * @access  Private
 */
const searchPlaces = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || !String(q).trim()) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const keyword = String(q).trim();
    const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegex(keyword), 'i');

    const places = await Place.find({
      $or: [
        { name: regex },
        { address: regex },
      ],
    })
      .limit(Number(limit))
      .lean();

    return res.json({
      success: true,
      data: places,
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
  getNearbyPlaces,
  searchPlaces,
};

