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
