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
