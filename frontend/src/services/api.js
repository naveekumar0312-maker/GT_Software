import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // Send and receive HttpOnly session cookies
});

// Interceptor to attach CSRF token if present
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && !['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle 401/403 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only dispatch auth:unauthorized if not already checking /auth/me/ or on /login
    if (error.response && error.response.status === 401) {
      const isAuthCheck = error.config?.url?.includes('/auth/me/');
      if (!isAuthCheck && window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export const firstReportService = {
  // Get all first reports with optional filters
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

export default apiClient;
