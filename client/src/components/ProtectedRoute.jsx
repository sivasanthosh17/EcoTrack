import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying authentication status...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Your role (<strong>{user.role}</strong>) does not have permission to access this page.
        </p>
        <span className="status-pill offline">Unauthorized Role</span>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
