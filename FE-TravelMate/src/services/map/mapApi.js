import api from '../api';

/**
 * Geocode an address to lat/lng coordinates
 * GET /api/map/geocode?address=...
 */
export const geocodeAddress = async (address) => {
  const response = await api.get('/map/geocode', {
    params: { address },
  });
  return response.data;
};

/**
 * Calculate route distance and duration between two coordinates
 * GET /api/map/distance?originLat=&originLng=&destLat=&destLng=
 */
export const getRouteDistance = async (origin, destination) => {
  const response = await api.get('/map/distance', {
    params: {
      originLat: origin.lat,
      originLng: origin.lng,
      destLat: destination.lat,
      destLng: destination.lng,
    },
  });
  return response.data;
};
