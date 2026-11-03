import apiClient from './api';

export const firstReportService = {
  // Get all first reports with optional filters (search, tour_type, branch, ordering)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/first-reports/', { params });
    return response.data;
  },

  // Get a single first report by id
  getById: async (id) => {
    const response = await apiClient.get(`/first-reports/${id}/`);
    return response.data;
  },

  // Create a new first report
  create: async (data) => {
    const response = await apiClient.post('/first-reports/', data);
    return response.data;
  },

  // Update an existing first report
  update: async (id, data) => {
    const response = await apiClient.put(`/first-reports/${id}/`, data);
    return response.data;
  },

  // Delete a first report
  delete: async (id) => {
    const response = await apiClient.delete(`/first-reports/${id}/`);
    return response.data;
  },

  // Download PDF
  downloadPdf: async (id) => {
    const response = await apiClient.get(`/first-reports/${id}/pdf/`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default firstReportService;
