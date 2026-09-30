import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  Planned: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  'In Progress': { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  Completed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  'On Hold': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }
};

const Projects = () => {
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalExpectedReduction: 0,
    totalActualReduction: 0,
    completedCount: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    department: ''
  });

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Quick Progress Modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressTarget, setProgressTarget] = useState(null);
  const [quickProgress, setQuickProgress] = useState(0);
  const [quickActual, setQuickActual] = useState(0);

  const [formData, setFormData] = useState({
    id: null,
    projectName: '',
    description: '',
    department: user?.department || 'General Sustainability',
    startDate: '',
    targetCompletionDate: '',
    budget: '',
    expectedCarbonReduction: '',
    actualCarbonReduction: '0',
    progressPercentage: 0,
    status: 'Planned',
    notes: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.department) queryParams.append('department', filters.department);

      const res = await fetch(`${API_BASE_URL}/projects?${queryParams.toString()}`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/departments`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const url = isEditing
      ? `${API_BASE_URL}/projects/${formData.id}`
      : `${API_BASE_URL}/projects`;

    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Project '${formData.projectName}' ${isEditing ? 'updated' : 'created'} successfully!`
        });
        setShowModal(false);
        resetForm();
        fetchProjects();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Operation failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server communication error.' });
    }
  };

  // Quick Progress Submit
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressTarget) return;

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${progressTarget._id}/progress`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          progressPercentage: quickProgress,
          actualCarbonReduction: quickActual
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Progress updated for project '${progressTarget.projectName}'.` });
        setShowProgressModal(false);
        setProgressTarget(null);
        fetchProjects();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to update progress.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while updating progress.' });
    }
  };

  // Edit Trigger
  const handleEditClick = (p) => {
    setFormData({
      id: p._id,
      projectName: p.projectName,
      description: p.description,
      department: p.department,
      startDate: p.startDate ? p.startDate.split('T')[0] : '',
      targetCompletionDate: p.targetCompletionDate ? p.targetCompletionDate.split('T')[0] : '',
      budget: p.budget,
      expectedCarbonReduction: p.expectedCarbonReduction,
      actualCarbonReduction: p.actualCarbonReduction || 0,
      progressPercentage: p.progressPercentage || 0,
      status: p.status,
      notes: p.notes || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Quick Progress Trigger
  const handleOpenProgress = (p) => {
    setProgressTarget(p);
    setQuickProgress(p.progressPercentage || 0);
    setQuickActual(p.actualCarbonReduction || 0);
    setShowProgressModal(true);
  };

  // Delete Trigger
  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete project '${name}'?`)) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Project '${name}' deleted successfully.` });
        fetchProjects();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to delete project.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while deleting project.' });
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      projectName: '',
      description: '',
      department: user?.department || 'General Sustainability',
      startDate: '',
      targetCompletionDate: '',
      budget: '',
      expectedCarbonReduction: '',
      actualCarbonReduction: '0',
      progressPercentage: 0,
      status: 'Planned',
      notes: ''
    });
    setIsEditing(false);
  };

  return (
    <div>
      {/* Title Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Carbon Reduction Projects</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Plan, execute, and monitor sustainability initiatives and emissions reduction projects
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Create New Project
        </button>
      </div>

      {/* Global Message Banner */}
      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL PROJECTS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {projects.length}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{summary.completedCount} Completed</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>CUMULATIVE BUDGET</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
            ${summary.totalBudget?.toLocaleString()}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allocated Capital</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TARGET CO₂ REDUCTION</span>
          <h2 style={{ fontSize: '1.8rem', color: '#f59e0b', marginTop: '0.2rem' }}>
            {summary.totalExpectedReduction?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Planned Annual Savings</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>ACHIEVED REDUCTION</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
            {summary.totalActualReduction?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Realized Savings</span>
        </div>
      </div>

      {/* Quick Update Progress Modal */}
      {showProgressModal && progressTarget && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title">Update Project Progress</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProgressModal(false)}>✕ Close</button>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Updating progress for <strong>{progressTarget.projectName}</strong> ({progressTarget.department})
          </p>

          <form onSubmit={handleProgressSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Completion Progress ({quickProgress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="form-input"
                  style={{ accentColor: 'var(--primary)', padding: 0 }}
                  value={quickProgress}
                  onChange={(e) => setQuickProgress(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Realized CO₂ Reduction (tCO₂e)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 45"
                  value={quickActual}
                  onChange={(e) => setQuickActual(e.target.value)}
                />
              </div>
            </div>

            {/* Visual Progress Preview */}
            <div style={{ margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                <span>Milestone Status:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{quickProgress}% Complete</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${quickProgress}%`, 
                    backgroundColor: quickProgress === 100 ? 'var(--primary)' : 'var(--accent)',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">Update Progress</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowProgressModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Project Modal Form */}
      {showModal && (
        <div className="card" style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="card-title">
              {isEditing ? 'Edit Project Specifications' : 'Create Carbon Reduction Project'}
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕ Close</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 500kW Rooftop Solar Panel Retrofit"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Project Scope & Objectives</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Detail the operational changes, expected energy efficiency gains, or waste diversion scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lead Department</label>
                <select
                  className="form-input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="General Sustainability">General Sustainability</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Project Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Completion Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.targetCompletionDate}
                  onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Capital Budget ($ USD)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 75000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target CO₂ Reduction (tCO₂e / yr)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 120"
                  value={formData.expectedCarbonReduction}
                  onChange={(e) => setFormData({ ...formData, expectedCarbonReduction: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Realized CO₂ Reduction (tCO₂e)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 30"
                  value={formData.actualCarbonReduction}
                  onChange={(e) => setFormData({ ...formData, actualCarbonReduction: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Progress Percentage ({formData.progressPercentage}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="form-input"
                  style={{ accentColor: 'var(--primary)', padding: 0 }}
                  value={formData.progressPercentage}
                  onChange={(e) => setFormData({ ...formData, progressPercentage: Number(e.target.value) })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes / Additional Specs</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vendor contracted: CleanEnergy Corp"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save Changes' : 'Create Project'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', alignItems: 'center' }}>
          <div>
            <input
              type="text"
              className="form-input"
              placeholder="Search project name or notes..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Filter by All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div>
            <select
              className="form-input"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">Filter by All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setFilters({ search: '', status: '', department: '' })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Projects Directory Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Loading project directory...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <h3>No Carbon Reduction Projects Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            No carbon reduction projects match your current filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {projects.map((p) => {
            const statusStyle = STATUS_COLORS[p.status] || STATUS_COLORS.Planned;
            return (
              <div key={p._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Card Top Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.2rem', lineHeight: '1.3' }}>{p.projectName}</h3>
                    <span 
                      className="status-pill"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.75rem' }}>
                    {p.department}
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    {p.description}
                  </p>

                  {/* Visual Progress Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Project Progress</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.progressPercentage || 0}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${p.progressPercentage || 0}%`, 
                          backgroundColor: p.status === 'Completed' ? 'var(--primary)' : 'var(--accent)',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>
                  </div>

                  {/* Metric Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', backgroundColor: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>BUDGET</span>
                      <strong style={{ color: 'var(--text-main)' }}>${p.budget ? p.budget.toLocaleString() : '0'}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>TARGET SAVINGS</span>
                      <strong style={{ color: '#f59e0b' }}>{p.expectedCarbonReduction} tCO₂e</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>TIMELINE</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'} - {p.targetCompletionDate ? new Date(p.targetCompletionDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>REALIZED SAVINGS</span>
                      <strong style={{ color: 'var(--primary)' }}>{p.actualCarbonReduction || 0} tCO₂e</strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenProgress(p)}
                  >
                    Progress
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleEditClick(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={() => handleDeleteClick(p._id, p.projectName)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;
