import api from './axiosConfig';

export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },
};
