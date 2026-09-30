import React, { useState, useEffect } from 'react';

const Home = () => {
  const [apiStatus, setApiStatus] = useState({ loading: true, online: false, data: null, error: null });

  useEffect(() => {
    const checkServer = async () => {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      try {
        const res = await fetch(`${base}/health`);
        const data = await res.json();
        if (res.ok) {
          setApiStatus({ loading: false, online: true, data, error: null });
        } else {
          setApiStatus({ loading: false, online: false, data: null, error: data.message || 'Server error' });
        }
      } catch (err) {
        setApiStatus({
          loading: false, online: false, data: null,
          error: 'Could not connect to the backend. Make sure the server is running on port 5000.'
        });
      }
    };
    checkServer();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '6px' }}>EcoTrack</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
        Greenhouse Gas & Sustainability Tracking System
      </p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Server Status</h3>
        {apiStatus.loading ? (
          <p style={{ color: 'var(--text-light)' }}>Checking connection...</p>
        ) : apiStatus.online ? (
          <div>
            <span className="status-pill online" style={{ marginBottom: '10px' }}>
              <span className="pulse-dot"></span> Connected
            </span>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '10px' }}>
              <strong>Environment:</strong> {apiStatus.data?.environment}
            </p>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              <strong>Server Time:</strong> {apiStatus.data?.timestamp}
            </p>
          </div>
        ) : (
          <div>
            <span className="status-pill offline" style={{ marginBottom: '10px' }}>
              <span className="pulse-dot"></span> Offline
            </span>
            <p style={{ color: 'var(--red)', fontSize: '0.9rem', marginTop: '10px' }}>
              {apiStatus.error}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="card">
          <h4 style={{ marginBottom: '8px' }}>Frontend</h4>
          <p style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>
            React 19, Vite build tool, React Router v6 for navigation, custom CSS styling.
          </p>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: '8px' }}>Backend</h4>
          <p style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>
            Node.js with Express, JWT authentication, Mongoose ODM for MongoDB.
          </p>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: '8px' }}>Features</h4>
          <p style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>
            GHG emission tracking, carbon projects, sustainability KPIs, climate action plans, and reports.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
