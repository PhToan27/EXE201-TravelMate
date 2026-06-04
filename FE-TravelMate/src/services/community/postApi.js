import api from '../api';

export const getPosts = async () => {
  const response = await api.get('/posts');
  return response.data;
};

export const getPostById = async (id) => {
  const response = await api.get(`/posts/${id}`);
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

export const toggleFollowAuthor = async (authorId) => {
  const response = await api.post(`/posts/authors/${authorId}/follow`);
  return response.data;
};
