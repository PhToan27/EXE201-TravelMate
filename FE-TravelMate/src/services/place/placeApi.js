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
 * Search places from MongoDB places collection
 * GET /api/places/search?q=...
 */
export const searchPlaces = async ({ q = '', category = '', limit = 30 } = {}) => {
  const response = await api.get('/places/search', {
    params: { q, category, limit },
  });
  return response.data;
};
