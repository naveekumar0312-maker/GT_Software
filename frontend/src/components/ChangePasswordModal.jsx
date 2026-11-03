import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import './ChangePasswordModal.css';

const ChangePasswordModal = () => {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password cannot be the same as the initial password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
    } catch (err) {
      if (err.response?.status === 403) {
        const detail = err.response.data?.detail || err.response.data?.message;
        if (detail && detail.toLowerCase().includes('csrf')) {
          setError('CSRF verification failed. Please refresh the page and try again.');
        } else {
          setError(detail || 'Current password is incorrect or session expired. Please verify your credentials.');
        }
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        const msg = err.response?.data?.message ||
                    (err.response?.data?.errors?.confirm_password && err.response.data.errors.confirm_password[0]) ||
                    (err.response?.data?.errors?.new_password && err.response.data.errors.new_password[0]) ||
                    (err.response?.data?.errors?.current_password && err.response.data.errors.current_password[0]) ||
                    err.message ||
                    'Failed to change password. Please check your credentials.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pwd-modal-overlay">
      <div className="pwd-modal-card">
        <div className="pwd-modal-header">
          <div className="pwd-modal-icon">
            <ShieldCheck size={28} />
          </div>
          <h2>Action Required: Set New Password</h2>
          <p>
            For security, initial administrator credentials must be updated before accessing the CRM system.
          </p>
        </div>

        {error && (
          <div className="pwd-error-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pwd-modal-form">
          <div className="pwd-form-group">
            <label htmlFor="current-pwd">Current Password</label>
            <div className="pwd-input-wrap">
              <input
                id="current-pwd"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={submitting}
                autoFocus
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pwd-form-group">
            <label htmlFor="new-pwd">New Password</label>
            <div className="pwd-input-wrap">
              <input
                id="new-pwd"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                disabled={submitting}
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pwd-form-group">
            <label htmlFor="confirm-pwd">Confirm New Password</label>
            <div className="pwd-input-wrap">
              <input
                id="confirm-pwd"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                disabled={submitting}
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pwd-modal-actions">
            <button
              type="button"
              className="pwd-btn-logout"
              onClick={logout}
              disabled={submitting}
            >
              Log Out
            </button>
            <button
              type="submit"
              className="pwd-btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Password & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

