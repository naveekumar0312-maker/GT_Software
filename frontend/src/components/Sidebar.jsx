import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, FileCheck, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger toggle button */}
      <button 
        type="button"
        className="sidebar-mobile-toggle" 
        onClick={toggleSidebar} 
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay when sidebar opened on mobile */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <span className="brand-logo-text">CRM</span>
          </div>
          <div className="brand-info">
            <h1 className="brand-title">CRM</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">MAIN OPERATIONS</div>
          
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <LayoutDashboard className="nav-icon" size={19} />
            <span className="nav-text">Dashboard</span>
          </NavLink>

          <NavLink
            to="/first-report"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <FileText className="nav-icon" size={19} />
            <span className="nav-text">First Report</span>
          </NavLink>

          <NavLink
            to="/final-report"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <FileCheck className="nav-icon" size={19} />
            <span className="nav-text">Final Report</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer with User Details and Logout */}
        <div className="sidebar-user-footer">
          {user && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar" aria-hidden="true">
                <User size={16} />
              </div>
              <div className="sidebar-user-meta">
                <span className="sidebar-username">{user.username}</span>
                <span className="sidebar-role">{user.is_superuser ? 'Administrator' : 'Staff'}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out of CRM"
          >
            <LogOut size={17} className="logout-icon" />
            <span className="logout-text">{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
