import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.getMe();
      if (data && data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 is expected when the user is not logged in yet.
      // Treat as unauthenticated without throwing an error.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for unauthorized 401 events from Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [checkAuth]);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    if (data.success && data.user) {
      setUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore network errors on logout to allow frontend logout to complete
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      // Optional: Clear any local non-sensitive flags
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const data = await authService.changePassword(currentPassword, newPassword, confirmPassword);
    if (data.success && data.user) {
      setUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Failed to change password');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        mustChangePassword: !!(user && user.must_change_password),
        login,
        logout,
        changePassword,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

