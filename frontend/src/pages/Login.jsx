import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state with remembered username lazily
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('crm_remembered_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(() => {
    return !!localStorage.getItem('crm_remembered_username');
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'CRM';
  }, []);

  // If already authenticated, redirect to destination or dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await login(cleanUsername, password);

      // Handle remember username
      if (rememberUsername) {
        localStorage.setItem('crm_remembered_username', cleanUsername);
      } else {
        localStorage.removeItem('crm_remembered_username');
      }

      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      const serverMsg = err.response?.data?.message ||
                        err.response?.data?.detail ||
                        (err.response?.data?.errors?.username && err.response.data.errors.username[0]) ||
                        err.message;
      if (err.response?.status === 429) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else {
        setError(serverMsg || 'Incorrect credentials. Please verify your username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-badge-wrap">
            <span className="login-badge-text">CRM</span>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to access your CRM Dashboard.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-alert-error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <span className="alert-text">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Username Field */}
          <div className="login-field-group">
            <label htmlFor="login-username" className="login-label">
              Username
            </label>
            <div className="login-input-container">
              <span className="login-input-lead-icon" aria-hidden="true">
                <User size={18} />
              </span>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                className="login-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-field-group">
            <label htmlFor="login-password" className="login-label">
              Password
            </label>
            <div className="login-input-container">
              <span className="login-input-lead-icon" aria-hidden="true">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="login-input login-input-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Username */}
          <div className="login-options-row">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                className="login-checkbox"
                checked={rememberUsername}
                onChange={(e) => setRememberUsername(e.target.checked)}
                disabled={loading}
              />
              <span className="login-checkbox-text">Remember Username</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-btn-loading">
                <Loader2 size={18} className="login-spinner" />
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
