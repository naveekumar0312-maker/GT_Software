import apiClient from './api';

export const finalReportService = {
  // Get all final reports with optional filters (search, tour_type, branch, ordering)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/final-reports/', { params });
    return response.data;
  },

  // Get a single final report by id
  getById: async (id) => {
    const response = await apiClient.get(`/final-reports/${id}/`);
    return response.data;
  },

  // Create a new final report
  create: async (data) => {
    const response = await apiClient.post('/final-reports/', data);
    return response.data;
  },

  // Update an existing final report
  update: async (id, data) => {
    const response = await apiClient.put(`/final-reports/${id}/`, data);
    return response.data;
  },

  // Delete a final report
  delete: async (id) => {
    const response = await apiClient.delete(`/final-reports/${id}/`);
    return response.data;
  },

  // Download PDF
  downloadPdf: async (id) => {
    const response = await apiClient.get(`/final-reports/${id}/pdf/`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default finalReportService;
