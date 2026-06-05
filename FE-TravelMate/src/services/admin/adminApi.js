import api from '../api';

/**
 * Get overall dashboard stats
 */
export const getStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Get user list with pagination and search query/filters
 */
export const getUsers = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

/**
 * Suspend or activate a user account
 */
export const updateUserStatus = async (userId, status) => {
  const response = await api.put(`/admin/users/${userId}/status`, { status });
  return response.data;
};

/**
 * Switch user subscription package (free/premium)
 */
export const updateUserPackage = async (userId, pkg) => {
  const response = await api.put(`/admin/users/${userId}/package`, { package: pkg });
  return response.data;
};

/**
 * Change administrative roles (user, admin, moderator, analyst)
 */
export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

/**
 * Get posts for moderation by status tab (pending, approved, reported)
 */
export const getPosts = async (tab, page = 1) => {
  const response = await api.get('/admin/posts', { params: { tab, page } });
  return response.data;
};

/**
 * Approve, reject, or clear flag on a post
 */
export const moderatePost = async (postId, action) => {
  const response = await api.post(`/admin/posts/${postId}/moderate`, { action });
  return response.data;
};

/**
 * Retrieve system configs and admin users list
 */
export const getSettings = async () => {
  const response = await api.get('/admin/settings');
  return response.data;
};

/**
 * Save new pricing configurations and notification settings
 */
export const updateSettings = async (payload) => {
  const response = await api.put('/admin/settings', payload);
  return response.data;
};
