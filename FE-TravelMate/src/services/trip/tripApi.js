import api from '../api';

/**
 * Get all trips for the authenticated user
 * GET /api/trips
 */
export const getTrips = async () => {
  const response = await api.get('/trips');
  return response.data;
};

/**
 * Get a single trip by ID
 * GET /api/trips/:id
 */
export const getTripById = async (id) => {
  const response = await api.get(`/trips/${id}`);
  return response.data;
};

/**
 * Create a new trip (with optional AI itinerary generation)
 * POST /api/trips
 * @param {Object} tripData - { destination, startDate, endDate, budget, generateAiItinerary, people, travelStyle, interests, hotelArea }
 */
export const createTrip = async (tripData) => {
  const response = await api.post('/trips', tripData);
  return response.data;
};

/**
 * Update an existing trip
 * PUT /api/trips/:id
 */
export const updateTrip = async (id, updates) => {
  const response = await api.put(`/trips/${id}`, updates);
  return response.data;
};

/**
 * Delete a trip
 * DELETE /api/trips/:id
 */
export const deleteTrip = async (id) => {
  const response = await api.delete(`/trips/${id}`);
  return response.data;
};

/**
 * Share a trip — generates a public share code
 * POST /api/trips/:id/share
 */
export const shareTrip = async (id) => {
  const response = await api.post(`/trips/${id}/share`);
  return response.data;
};

/**
 * Get a shared trip by its public share code (no auth required)
 * GET /api/trips/shared/:shareCode
 */
export const getSharedTrip = async (shareCode) => {
  const response = await api.get(`/trips/shared/${shareCode}`);
  return response.data;
};
