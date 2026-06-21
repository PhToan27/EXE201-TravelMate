import api from '../api';

/**
 * Get all journal entries for a specific trip
 * GET /api/trips/:tripId/journals
 */
export const getJournalsByTrip = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/journals`);
  return response.data;
};

/**
 * Get a single journal entry by ID
 * GET /api/journals/:id
 */
export const getJournalById = async (id) => {
  const response = await api.get(`/journals/${id}`);
  return response.data;
};

/**
 * Create a new journal entry (with multiple images upload)
 * POST /api/trips/:tripId/journals
 */
export const createJournal = async (tripId, formData) => {
  const response = await api.post(`/trips/${tripId}/journals`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Update an existing journal entry
 * PUT /api/journals/:id
 */
export const updateJournal = async (id, formData) => {
  const response = await api.put(`/journals/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete a journal entry
 * DELETE /api/journals/:id
 */
export const deleteJournal = async (id) => {
  const response = await api.delete(`/journals/${id}`);
  return response.data;
};
