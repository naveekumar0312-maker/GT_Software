import apiClient from './api';

export const authService = {
  // Login with username & password (session cookie returned by Django)
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login/', { username, password });
    return response.data;
  },

  // Logout and destroy session
  logout: async () => {
    const response = await apiClient.post('/auth/logout/');
    return response.data;
  },

  // Check current session
  getMe: async () => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },
};

export default authService;

