import api from './axiosConfig';

export const userAPI = {
  // Get all users
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/auth/users/?${params}`);
    return response.data;
  },

  // Get single user
  getById: async (id) => {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  },

  // Create user (admin only)
  create: async (userData) => {
    const response = await api.post('/auth/users/', userData);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.patch(`/auth/users/${id}/`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/auth/users/${id}/`);
    return response.data;
  },

  // Deactivate user
  deactivate: async (id) => {
    const response = await api.patch(`/auth/users/${id}/`, { is_active: false });
    return response.data;
  },

  // Activate user
  activate: async (id) => {
    const response = await api.patch(`/auth/users/${id}/`, { is_active: true });
    return response.data;
  },
};
