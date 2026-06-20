import api from '../api';

/**
 * Get place details by place name
 * GET /api/places/detail?name=...
 * @param {string} name - Name of the place/destination
 */
export const getPlaceDetails = async (name) => {
  const response = await api.get('/places/detail', {
    params: { name },
  });
  return response.data;
};

/**
 * Get nearby places from coordinates
 * GET /api/places/nearby?lat=...&lng=...&excludeName=...&limit=...
 */
export const getNearbyPlaces = async (lat, lng, excludeName = '', limit = 5, type = '', destination = '') => {
  const response = await api.get('/places/nearby', {
    params: { lat, lng, excludeName, limit, type, destination },
  });
  return response.data;
};
