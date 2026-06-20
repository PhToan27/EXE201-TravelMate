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
 * Login or register via Google OAuth
 * POST /api/auth/google
 */
export const googleLogin = async ({ googleId, email, name, avatar }) => {
  const response = await api.post('/auth/google', { googleId, email, name, avatar });
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

/**
 * Upgrade authenticated user to premium
 * PUT /api/auth/upgrade
 */
export const upgradeToPremium = async () => {
  const response = await api.put('/auth/upgrade');
  return response.data;
};
