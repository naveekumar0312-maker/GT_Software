import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FirstReportList from './pages/FirstReportList';
import FirstReportForm from './pages/FirstReportForm';
import FirstReportView from './pages/FirstReportView';
import FinalReportList from './pages/FinalReportList';
import FinalReportForm from './pages/FinalReportForm';
import FinalReportView from './pages/FinalReportView';
import './styles/global.css';

// Layout wrapper for authenticated routes that include the Sidebar and main content layout
const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* PUBLIC ROUTE: Admin Login */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED ROUTES */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* DASHBOARD MODULE ROUTE (DEFAULT HOME) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* FIRST REPORT MODULE ROUTES */}
            <Route path="/first-report" element={<FirstReportList />} />
            <Route path="/first-report/new" element={<FirstReportForm />} />
            <Route path="/first-report/:id/view" element={<FirstReportView />} />
            <Route path="/first-report/:id/edit" element={<FirstReportForm />} />

            {/* FINAL REPORT MODULE ROUTES */}
            <Route path="/final-report" element={<FinalReportList />} />
            <Route path="/final-report/new" element={<FinalReportForm />} />
            <Route path="/final-report/:id/view" element={<FinalReportView />} />
            <Route path="/final-report/:id/edit" element={<FinalReportForm />} />

            {/* Default redirect inside protected area */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all redirect to Dashboard (which redirects to /login if unauthenticated) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
