import api from './axiosConfig';

export const vacancyAPI = {
  // Get all vacancies
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/vacancies/?${params}`);
    return response.data;
  },

  // Get single vacancy
  getById: async (id) => {
    const response = await api.get(`/vacancies/${id}/`);
    return response.data;
  },

  // Create vacancy
  create: async (vacancyData) => {
    const response = await api.post('/vacancies/', vacancyData);
    return response.data;
  },

  // Update vacancy
  update: async (id, vacancyData) => {
    const response = await api.put(`/vacancies/${id}/`, vacancyData);
    return response.data;
  },

  // Delete vacancy
  delete: async (id) => {
    const response = await api.delete(`/vacancies/${id}/`);
    return response.data;
  },

  // Get public vacancies (no auth required)
  getPublic: async () => {
    const response = await api.get('/vacancies/public_list/');
    return response.data;
  },

  // Get single public vacancy by ID (no auth required)
  getPublicById: async (id) => {
    const response = await api.get(`/vacancies/${id}/public_detail/`);
    return response.data;
  },
};