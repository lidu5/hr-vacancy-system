import api from './axiosConfig';

export const applicationAPI = {
  // Get all applications
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/applications/?${params}`);
    return response.data;
  },

  // Get single application
  getById: async (id) => {
    const response = await api.get(`/applications/${id}/`);
    return response.data;
  },

  // Create application
  create: async (applicationData) => {
    const response = await api.post('/applications/', applicationData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update application status
  updateStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/applications/${id}/update_status/`, {
      status,
      notes
    });
    return response.data;
  },

  // Get applications for a specific vacancy
  getByVacancy: async (vacancyId) => {
    const response = await api.get(`/applications/?vacancy=${vacancyId}`);
    return response.data;
  },

  // Get my applications (for candidates)
  getMyApplications: async () => {
    const response = await api.get('/applications/my_applications/');
    return response.data;
  },
};

export const candidateAPI = {
  // Get all candidates
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/candidates/?${params}`);
    return response.data;
  },

  // Get single candidate
  getById: async (id) => {
    const response = await api.get(`/candidates/${id}/`);
    return response.data;
  },

  // Create candidate
  create: async (candidateData) => {
    const formData = new FormData();
    Object.keys(candidateData).forEach(key => {
      if (candidateData[key] !== null && candidateData[key] !== undefined) {
        formData.append(key, candidateData[key]);
      }
    });
    const response = await api.post('/candidates/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update candidate
  update: async (id, candidateData) => {
    const formData = new FormData();
    Object.keys(candidateData).forEach(key => {
      if (candidateData[key] !== null && candidateData[key] !== undefined) {
        formData.append(key, candidateData[key]);
      }
    });
    const response = await api.put(`/candidates/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};