import React from 'react';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)', maxWdith: '500px', margin: '0 auto 1.5rem auto' }}>
        {description}
      </p>
      <span className="status-pill" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--accent)' }}>
        Under Construction (Module Phase)
      </span>
    </div>
  );
};

export default PlaceholderPage;
