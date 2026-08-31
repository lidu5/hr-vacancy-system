import api from './axiosConfig';

export const interviewAPI = {
  // Get all interviews
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/interviews/?${params}`);
    return response.data;
  },

  // Get single interview
  getById: async (id) => {
    const response = await api.get(`/interviews/${id}/`);
    return response.data;
  },

  // Create interview
  create: async (interviewData) => {
    const response = await api.post('/interviews/', interviewData);
    return response.data;
  },

  // Update interview
  update: async (id, interviewData) => {
    const response = await api.put(`/interviews/${id}/`, interviewData);
    return response.data;
  },

  // Delete interview
  delete: async (id) => {
    const response = await api.delete(`/interviews/${id}/`);
    return response.data;
  },

  // Get my interviews (for interviewers)
  getMyInterviews: async () => {
    const response = await api.get('/interviews/my_interviews/');
    return response.data;
  },

  // Submit interview feedback
  submitFeedback: async (id, feedbackData) => {
    const response = await api.patch(`/interviews/${id}/submit_feedback/`, feedbackData);
    return response.data;
  },
};
