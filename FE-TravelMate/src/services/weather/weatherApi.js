import api from '../api';

export const getWeather = async (destination, days) => {
  const response = await api.get('/weather', {
    params: { destination, days },
  });
  return response.data;
};
