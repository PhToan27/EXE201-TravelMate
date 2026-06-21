import api from '../api';

export const getNavigationToPlace = async (placeId, { fromLat, fromLng, vehicle = 'motorcycle', placeName }) => {
  const response = await api.get(`/navigation/place/${placeId}`, {
    params: {
      fromLat,
      fromLng,
      vehicle,
      placeName,
    },
  });

  return response.data;
};

export const getNavigationEstimate = async ({ fromLat, fromLng, toLat, toLng, vehicle = 'motorcycle' }) => {
  const response = await api.get('/navigation/estimate', {
    params: {
      fromLat,
      fromLng,
      toLat,
      toLng,
      vehicle,
    },
  });
  return response.data;
};

