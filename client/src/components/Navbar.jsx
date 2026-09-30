import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  if (!user) {
    // Top Bar Header for Unauthenticated Users (Home, Login, Register)
    return (
      <header className="navbar no-print">
        <div className="navbar-inner">
          <Link to="/" className="brand-logo">
            🌱 EcoTrack
            <span className="brand-badge">GHG Portal</span>
          </Link>
          <nav>
            <ul className="nav-links">
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                  Home
                </NavLink>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NavLink to="/login" className="btn btn-secondary btn-sm">
                  Login
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Register
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }

  // Sidebar Layout for Authenticated Users
  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="mobile-header no-print">
        <Link to="/dashboard" className="brand-logo">
          🌱 EcoTrack
        </Link>
        <button 
          className="mobile-toggle-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Main Sidebar Navigation */}
      <aside className={`sidebar no-print ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="brand-logo" onClick={closeMobileMenu}>
            🌱 EcoTrack
            <span className="brand-badge">v1.0</span>
          </Link>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <span className={`role-badge ${user.role === 'Organization Admin' ? 'admin' : 'officer'}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">MAIN NAVIGATION</div>
          <ul className="sidebar-links">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📊</span>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/organization" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">🏢</span>
                Organization
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/emissions" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">💨</span>
                GHG Emissions
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/projects" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📉</span>
                Carbon Projects
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/kpis" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">🎯</span>
                Sustainability KPIs
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/action-plans" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📋</span>
                Climate Plans
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/reports" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📄</span>
                Reports
              </NavLink>
            </li>
          </ul>

          <div className="nav-section-title" style={{ marginTop: '1.5rem' }}>QUICK ACTIONS</div>
          <ul className="sidebar-links">
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">🏠</span>
                Home Page
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary btn-logout"
            style={{ width: '100%' }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div 
          className="mobile-backdrop no-print"
          onClick={closeMobileMenu}
        />
      )}
    </>
  );
};

export default Navbar;

