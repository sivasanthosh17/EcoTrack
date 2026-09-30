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

  const closeMobile = () => setMobileOpen(false);

  // Simple top navbar for guests
  if (!user) {
    return (
      <header className="navbar no-print">
        <div className="navbar-inner">
          <Link to="/" className="brand-logo">
            EcoTrack
          </Link>
          <nav>
            <ul className="nav-links">
              <li style={{ display: 'flex', gap: '8px' }}>
                <NavLink to="/login" className="btn btn-secondary btn-sm">Login</NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">Register</NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }

  // Sidebar for logged-in users
  return (
    <>
      <header className="mobile-header no-print">
        <Link to="/dashboard" className="brand-logo">EcoTrack</Link>
        <button className="mobile-toggle-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '\u00D7' : '\u2261'}
        </button>
      </header>

      <aside className={`sidebar no-print ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="brand-logo" onClick={closeMobile}>
            EcoTrack
            <span className="brand-badge">v1.0</span>
          </Link>
        </div>

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

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu</div>
          <ul className="sidebar-links">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={closeMobile}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/organization" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={closeMobile}>
                Organization
              </NavLink>
            </li>
            <li>
              <NavLink to="/emissions" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={closeMobile}>
                Emissions
              </NavLink>
            </li>
            <li>
              <NavLink to="/projects" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={closeMobile}>
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink to="/kpis" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={closeMobile}>
                KPIs
              </NavLink>
            </li>
            <li>
              <NavLink to="/action-plans" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={closeMobile}>
                Action Plans
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={closeMobile}>
                Reports
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="mobile-backdrop no-print" onClick={closeMobile} />}
    </>
  );
};

export default Navbar;
