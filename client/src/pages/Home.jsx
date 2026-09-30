import React, { useState, useEffect } from 'react';

const Home = () => {
  const [apiStatus, setApiStatus] = useState({ loading: true, online: false, data: null, error: null });

  useEffect(() => {
    const checkServerHealth = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        const data = await response.json();
        if (response.ok) {
          setApiStatus({ loading: false, online: true, data, error: null });
        } else {
          setApiStatus({ loading: false, online: false, data: null, error: data.message || 'Server error' });
        }
      } catch (err) {
        setApiStatus({ 
          loading: false, 
          online: false, 
          data: null, 
          error: 'Could not connect to Express backend. Ensure server is running on port 5000.' 
        });
      }
    };

    checkServerHealth();
  }, []);

  return (
    <div className="home-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>EcoTrack Foundation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Greenhouse Gas & Sustainability Tracking System — MERN Stack Project Baseline
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title">
          Backend API Connection Status
        </h2>
        {apiStatus.loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Checking backend health...</p>
        ) : apiStatus.online ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="status-pill online">
                <span className="pulse-dot"></span> Online & Connected
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>Message:</strong> {apiStatus.data?.message}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>Environment:</strong> {apiStatus.data?.environment}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>Timestamp:</strong> {apiStatus.data?.timestamp}
            </p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="status-pill offline">
                <span className="pulse-dot"></span> Backend Offline
              </span>
            </div>
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              {apiStatus.error}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Frontend Architecture</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            React 19 initialized with Vite, Client-side Routing via React Router v6, custom CSS design system.
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>Backend Architecture</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Node.js & Express API, dotenv environment configuration, Mongoose ODM database connection driver.
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--warning)' }}>Next Steps (Phase 2)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Database Mongoose Models (User, Facility, EmissionLog, Project, KPI) and JWT Authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
