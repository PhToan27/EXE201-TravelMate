import api from '../api';

export const getPosts = async () => {
  const response = await api.get('/posts');
  return response.data;
};

export const getPostById = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

export const getMyPosts = async () => {
  const response = await api.get('/posts/me/posts');
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get('/posts/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/posts/notifications/${id}/read`);
  return response.data;
};

export const getUserProfile = async (id) => {
  const response = await api.get(`/posts/users/${id}`);
  return response.data;
};

export const getAdminPosts = async (params = {}) => {
  const response = await api.get('/posts/admin/posts', { params });
  return response.data;
};

export const updatePostStatus = async (id, { status, reason }) => {
  const response = await api.patch(`/posts/admin/posts/${id}/status`, { status, reason });
  return response.data;
};

export const createPost = async ({ title, content, category, image }) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('category', category || 'Mới nhất');

  if (image?.uri) {
    formData.append('image', {
      uri: image.uri,
      name: image.fileName || `travelmate-post-${Date.now()}.jpg`,
      type: image.mimeType || 'image/jpeg',
    });
  }

  const response = await api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const toggleLikePost = async (id) => {
  const response = await api.post(`/posts/${id}/like`);
  return response.data;
};

export const addComment = async (id, content) => {
  const response = await api.post(`/posts/${id}/comments`, { content });
  return response.data;
};

export const sharePost = async (id) => {
  const response = await api.post(`/posts/${id}/share`);
  return response.data;
};

export const reportPost = async (id) => {
  const response = await api.post(`/posts/${id}/report`);
  return response.data;
};

export const toggleFollowAuthor = async (authorId) => {
  const response = await api.post(`/posts/authors/${authorId}/follow`);
  return response.data;
};
