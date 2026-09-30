import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
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
            
            {user && (
              <>
                <li>
                  <NavLink 
                    to="/organization" 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  >
                    Organization
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/emissions" 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  >
                    Emissions
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/projects" 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  >
                    Projects
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/kpis" 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  >
                    KPIs
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/action-plans" 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  >
                    Climate Plans
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/reports" 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  >
                    Reports
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                  >
                    Dashboard
                  </NavLink>
                </li>
              </>
            )}

            {user ? (
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {user.name}
                  </div>
                  <span className={`role-badge ${user.role === 'Organization Admin' ? 'admin' : 'officer'}`}>
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary btn-sm"
                  title="Sign out of your session"
                >
                  Logout
                </button>
              </li>
            ) : (
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                <NavLink to="/login" className="btn btn-secondary btn-sm">
                  Login
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Register
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
