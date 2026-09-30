import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGES = {
  Achieved: { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(52, 211, 153, 0.3)', label: 'Achieved' },
  'On Track': { bg: 'rgba(6, 182, 212, 0.18)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)', label: 'On Track' },
  'At Risk': { bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)', label: 'At Risk' },
  'Off Track': { bg: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: 'rgba(248, 113, 113, 0.3)', label: 'Off Track' },
  'Pending Data': { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)', label: 'Pending Data' }
};

const CATEGORY_ICONS = {
  Energy: '⚡',
  Water: '💧',
  Waste: '♻️',
  Transportation: '🚗',
  Emissions: '🏭',
  'Renewable Energy': '☀️'
};

const KPIs = () => {
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const isAdmin = user?.role === 'Organization Admin';

  const [kpis, setKPIs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    achieved: 0,
    onTrack: 0,
    atRisk: 0,
    offTrack: 0,
    pending: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    department: '',
    frequency: ''
  });

  // Define / Edit KPI Modal
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Record Measurement Modal
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [measureForm, setMeasureForm] = useState({
    reportingPeriod: '',
    actualValue: '',
    notes: ''
  });

  // History Drawer / Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [kpiForm, setKPIForm] = useState({
    id: null,
    kpiName: '',
    category: 'Emissions',
    description: '',
    unit: 'tCO2e',
    targetValue: '',
    reportingFrequency: 'Monthly',
    department: user?.department || 'General Sustainability'
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchKPIs();
    fetchDepartments();
  }, [filters]);

  const fetchKPIs = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.frequency) queryParams.append('frequency', filters.frequency);

      const res = await fetch(`${API_BASE_URL}/kpis?${queryParams.toString()}`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setKPIs(data.kpis || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load KPIs', err);
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

  // Define or Edit KPI Submit
  const handleKPISubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const url = isEditing
      ? `${API_BASE_URL}/kpis/${kpiForm.id}`
      : `${API_BASE_URL}/kpis`;

    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(kpiForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Sustainability KPI '${kpiForm.kpiName}' ${isEditing ? 'updated' : 'defined'} successfully!`
        });
        setShowKPIModal(false);
        resetKPIForm();
        fetchKPIs();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Operation failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server communication error.' });
    }
  };

  // Record Measurement Submit
  const handleMeasureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKPI) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/kpis/${selectedKPI._id}/measurements`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(measureForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Measurement logged for KPI '${selectedKPI.kpiName}'. Updated Status: ${data.updatedKPI?.status}`
        });
        setShowMeasureModal(false);
        setSelectedKPI(null);
        fetchKPIs();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to record measurement.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while recording measurement.' });
    }
  };

  // Open Measurement History
  const handleOpenHistory = async (kpi) => {
    setSelectedKPI(kpi);
    try {
      const res = await fetch(`${API_BASE_URL}/kpis/${kpi._id}/measurements`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setHistoryLogs(data.measurements || []);
        setShowHistoryModal(true);
      }
    } catch (err) {
      console.error('Failed to load measurement history', err);
    }
  };

  // Edit KPI Trigger
  const handleEditClick = (k) => {
    setKPIForm({
      id: k._id,
      kpiName: k.kpiName,
      category: k.category,
      description: k.description || '',
      unit: k.unit,
      targetValue: k.targetValue,
      reportingFrequency: k.reportingFrequency || 'Monthly',
      department: k.department
    });
    setIsEditing(true);
    setShowKPIModal(true);
  };

  // Delete KPI Trigger
  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete KPI '${name}' and all associated measurement history?`)) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/kpis/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `KPI '${name}' deleted successfully.` });
        fetchKPIs();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to delete KPI.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while deleting KPI.' });
    }
  };

  // Open Record Measurement Trigger
  const handleOpenMeasure = (kpi) => {
    setSelectedKPI(kpi);
    setMeasureForm({
      reportingPeriod: getCurrentPeriod(),
      actualValue: '',
      notes: ''
    });
    setShowMeasureModal(true);
  };

  const resetKPIForm = () => {
    setKPIForm({
      id: null,
      kpiName: '',
      category: 'Emissions',
      description: '',
      unit: 'tCO2e',
      targetValue: '',
      reportingFrequency: 'Monthly',
      department: user?.department || 'General Sustainability'
    });
    setIsEditing(false);
  };

  // Calculate live rule-based status preview for Measurement form
  const getPreviewStatus = (category, actual, target) => {
    const val = Number(actual);
    const tgt = Number(target);
    if (isNaN(val) || actual === '') return 'Pending Evaluation';

    const isIncrease = category === 'Renewable Energy';
    if (isIncrease) {
      if (val >= tgt) return 'Achieved';
      if (val >= tgt * 0.85) return 'On Track';
      if (val >= tgt * 0.70) return 'At Risk';
      return 'Off Track';
    } else {
      if (val <= tgt) return 'Achieved';
      if (val <= tgt * 1.15) return 'On Track';
      if (val <= tgt * 1.30) return 'At Risk';
      return 'Off Track';
    }
  };

  return (
    <div>
      {/* Title Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Sustainability KPIs & Targets</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Define key performance indicators, record periodic measurements, and track compliance against targets
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetKPIForm();
              setShowKPIModal(true);
            }}
          >
            + Define New KPI
          </button>
        )}
      </div>

      {/* Global Message Banner */}
      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL DEFINED KPIS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {summary.total}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{summary.pending} Pending Data</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>ACHIEVED / ON TRACK</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
            {summary.achieved + summary.onTrack}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Meeting Targets</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>AT RISK</span>
          <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginTop: '0.2rem' }}>
            {summary.atRisk}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>Requires Attention</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>OFF TRACK</span>
          <h2 style={{ fontSize: '1.8rem', color: '#f87171', marginTop: '0.2rem' }}>
            {summary.offTrack}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#f87171' }}>Exceeding Benchmark</span>
        </div>
      </div>

      {/* Record Measurement Modal */}
      {showMeasureModal && selectedKPI && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title">Record Period Measurement for {selectedKPI.kpiName}</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMeasureModal(false)}>✕ Close</button>
          </div>

          <form onSubmit={handleMeasureSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Reporting Period (YYYY-MM / Period Code)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2026-09 or 2026-Q3"
                  value={measureForm.reportingPeriod}
                  onChange={(e) => setMeasureForm({ ...measureForm, reportingPeriod: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Measured Value ({selectedKPI.unit})</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder={`Target is ${selectedKPI.targetValue} ${selectedKPI.unit}`}
                  value={measureForm.actualValue}
                  onChange={(e) => setMeasureForm({ ...measureForm, actualValue: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Measurement Notes / Source Data</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Verified from monthly facility audit log"
                  value={measureForm.notes}
                  onChange={(e) => setMeasureForm({ ...measureForm, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Rule-Based Logic Comparison Preview Box */}
            <div 
              style={{ 
                marginTop: '1.25rem', 
                padding: '1rem', 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>RULE-BASED EVALUATION PREVIEW:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Target: <strong>{selectedKPI.targetValue} {selectedKPI.unit}</strong> | Measured: <strong>{measureForm.actualValue || 0} {selectedKPI.unit}</strong>
                </p>
              </div>
              <div>
                <span className="status-pill" style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem' }}>
                  Evaluated Status: <strong>{getPreviewStatus(selectedKPI.category, measureForm.actualValue, selectedKPI.targetValue)}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary">Save Measurement</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowMeasureModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Measurement History Modal / Drawer */}
      {showHistoryModal && selectedKPI && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title">Measurement History for {selectedKPI.kpiName}</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowHistoryModal(false)}>✕ Close</button>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Target Benchmark: <strong>{selectedKPI.targetValue} {selectedKPI.unit}</strong> ({selectedKPI.reportingFrequency})
          </p>

          {historyLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No historical measurements recorded yet for this KPI.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem' }}>Period</th>
                    <th style={{ padding: '0.6rem' }}>Actual Measured Value</th>
                    <th style={{ padding: '0.6rem' }}>Target Comparison</th>
                    <th style={{ padding: '0.6rem' }}>Recorded By</th>
                    <th style={{ padding: '0.6rem' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map((log) => {
                    const diff = log.actualValue - selectedKPI.targetValue;
                    return (
                      <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.65rem', fontWeight: 600 }}>{log.reportingPeriod}</td>
                        <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {log.actualValue} {selectedKPI.unit}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <span style={{ color: diff <= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                            {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} {selectedKPI.unit} vs Target
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem', color: 'var(--text-dim)' }}>{log.recordedBy?.name || 'Officer'}</td>
                        <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{log.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Define / Edit KPI Modal Form */}
      {showKPIModal && (
        <div className="card" style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="card-title">
              {isEditing ? 'Edit Sustainability KPI Definition' : 'Define New Sustainability KPI'}
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowKPIModal(false)}>✕ Close</button>
          </div>

          <form onSubmit={handleKPISubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">KPI Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Municipal Electricity Consumption Intensity"
                  value={kpiForm.kpiName}
                  onChange={(e) => setKPIForm({ ...kpiForm, kpiName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={kpiForm.category}
                  onChange={(e) => setKPIForm({ ...kpiForm, category: e.target.value })}
                >
                  <option value="Energy">Energy</option>
                  <option value="Water">Water</option>
                  <option value="Waste">Waste</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Emissions">Emissions</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-input"
                  value={kpiForm.department}
                  onChange={(e) => setKPIForm({ ...kpiForm, department: e.target.value })}
                  required
                >
                  <option value="General Sustainability">General Sustainability</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Unit of Measurement</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. kWh, tCO2e, %, m3, kg"
                  value={kpiForm.unit}
                  onChange={(e) => setKPIForm({ ...kpiForm, unit: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Benchmark Value</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 5000"
                  value={kpiForm.targetValue}
                  onChange={(e) => setKPIForm({ ...kpiForm, targetValue: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reporting Frequency</label>
                <select
                  className="form-input"
                  value={kpiForm.reportingFrequency}
                  onChange={(e) => setKPIForm({ ...kpiForm, reportingFrequency: e.target.value })}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description / Scope</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Target threshold for overall facility power draw per month"
                  value={kpiForm.description}
                  onChange={(e) => setKPIForm({ ...kpiForm, description: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save Changes' : 'Define KPI'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowKPIModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.9rem', alignItems: 'center' }}>
          <div>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search KPI name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <select
              className="form-input"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="Energy">Energy</option>
              <option value="Water">Water</option>
              <option value="Waste">Waste</option>
              <option value="Transportation">Transportation</option>
              <option value="Emissions">Emissions</option>
              <option value="Renewable Energy">Renewable Energy</option>
            </select>
          </div>

          <div>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Achieved">Achieved</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Off Track">Off Track</option>
              <option value="Pending Data">Pending Data</option>
            </select>
          </div>

          <div>
            <select
              className="form-input"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setFilters({ search: '', category: '', status: '', department: '', frequency: '' })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* KPI Directory Grid */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading sustainability KPIs...</p>
      ) : kpis.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No sustainability KPIs match your filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {kpis.map((k) => {
            const badge = STATUS_BADGES[k.status] || STATUS_BADGES['Pending Data'];
            const icon = CATEGORY_ICONS[k.category] || '📊';

            return (
              <div key={k._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                      <h3 style={{ fontSize: '1.15rem', lineHeight: '1.3' }}>{k.kpiName}</h3>
                    </div>
                    <span
                      className="status-pill"
                      style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                    >
                      {k.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                    <span className="brand-badge">{k.category}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>🏢 {k.department}</span>
                    <span style={{ color: 'var(--text-dim)' }}>📅 {k.reportingFrequency}</span>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    {k.description || 'No detailed scope provided.'}
                  </p>

                  {/* Target vs Actual Comparison Box */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TARGET BENCHMARK:</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {k.targetValue} {k.unit}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>LATEST MEASURED:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: k.currentValue !== null ? 'var(--primary)' : 'var(--text-dim)' }}>
                        {k.currentValue !== null && k.currentValue !== undefined ? `${k.currentValue} ${k.unit}` : 'Not Measured'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenMeasure(k)}
                  >
                    + Measure
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenHistory(k)}
                  >
                    📜 History
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditClick(k)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => handleDeleteClick(k._id, k.kpiName)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KPIs;
