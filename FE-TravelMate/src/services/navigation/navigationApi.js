import api from '../api';

export const getNavigationToPlace = async (placeId, { fromLat, fromLng, vehicle = 'motorcycle' }) => {
  const response = await api.get(`/navigation/place/${placeId}`, {
    params: {
      fromLat,
      fromLng,
      vehicle,
    },
  });

  return response.data;
};
