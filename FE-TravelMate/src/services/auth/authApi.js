import api from '../api';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async ({ name, email, password }) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

/**
 * Login user and receive JWT
 * POST /api/auth/login
 */
export const login = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Get authenticated user's profile
 * GET /api/auth/profile
 */
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};
