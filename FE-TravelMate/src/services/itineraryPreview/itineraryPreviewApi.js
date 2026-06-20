import api from '../api';

export const createItineraryPreview = async (input) => {
  const response = await api.post('/itinerary-preview', input);
  return response.data;
};
