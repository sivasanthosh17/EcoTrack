import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FACTORS = {
  Electricity: { factor: 0.00085, unit: 'kWh', scope: 'Scope 2', label: 'Grid Electricity (0.85 kg CO2e/kWh)' },
  Diesel: { factor: 0.00268, unit: 'Liters', scope: 'Scope 1', label: 'Diesel Fuel (2.68 kg CO2e/Liter)' },
  Petrol: { factor: 0.00231, unit: 'Liters', scope: 'Scope 1', label: 'Motor Gasoline (2.31 kg CO2e/Liter)' },
  'Natural Gas': { factor: 0.0019, unit: 'm3', scope: 'Scope 1', label: 'Natural Gas (1.90 kg CO2e/m³)' },
  Transportation: { factor: 0.00017, unit: 'km', scope: 'Scope 3', label: 'Fleet & Commute (0.17 kg CO2e/km)' },
  Waste: { factor: 0.0005, unit: 'kg', scope: 'Scope 3', label: 'Solid Waste (0.50 kg CO2e/kg)' },
  Water: { factor: 0.0003, unit: 'm3', scope: 'Scope 3', label: 'Water Supply (0.30 kg CO2e/m³)' },
  Other: { factor: 0.0010, unit: 'Metric Tons', scope: 'Scope 3', label: 'Custom Activity' }
};

const Emissions = () => {
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const [emissions, setEmissions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalCO2e, setTotalCO2e] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    scope: '',
    period: ''
  });

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [formData, setFormData] = useState({
    id: null,
    department: user?.department || 'General Sustainability',
    emissionSource: 'Electricity',
    scope: 'Scope 2',
    activityValue: '',
    unit: 'kWh',
    emissionFactor: 0.00085,
    reportingPeriod: getCurrentPeriod(),
    notes: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchEmissions();
    fetchDepartments();
  }, [filters]);

  const fetchEmissions = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.source) queryParams.append('source', filters.source);
      if (filters.scope) queryParams.append('scope', filters.scope);
      if (filters.period) queryParams.append('period', filters.period);

      const res = await fetch(`${API_BASE_URL}/emissions?${queryParams.toString()}`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setEmissions(data.emissions || []);
        setTotalCO2e(data.totalCO2e || 0);
      }
    } catch (err) {
      console.error('Failed to load emissions', err);
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

  // Handle Source Selection Change to auto-suggest factor and unit
  const handleSourceChange = (e) => {
    const selectedSource = e.target.value;
    const def = DEFAULT_FACTORS[selectedSource] || DEFAULT_FACTORS.Other;

    setFormData({
      ...formData,
      emissionSource: selectedSource,
      unit: def.unit,
      scope: def.scope,
      emissionFactor: def.factor
    });
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const val = Number(formData.activityValue);
    const factor = Number(formData.emissionFactor);

    if (isNaN(val) || val <= 0) {
      setMessage({ type: 'danger', text: 'Please enter a valid activity value greater than 0.' });
      return;
    }

    const payload = {
      ...formData,
      activityValue: val,
      emissionFactor: factor
    };

    const url = isEditing
      ? `${API_BASE_URL}/emissions/${formData.id}`
      : `${API_BASE_URL}/emissions`;

    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Emission record ${isEditing ? 'updated' : 'added'} successfully!`
        });
        setShowFormModal(false);
        resetForm();
        fetchEmissions();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Operation failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server communication error.' });
    }
  };

  // Edit Trigger
  const handleEditClick = (item) => {
    setFormData({
      id: item._id,
      department: item.department,
      emissionSource: item.emissionSource,
      scope: item.scope,
      activityValue: item.activityValue,
      unit: item.unit,
      emissionFactor: item.emissionFactor,
      reportingPeriod: item.reportingPeriod,
      notes: item.notes || ''
    });
    setIsEditing(true);
    setShowFormModal(true);
  };

  // Delete Trigger
  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this emission log?')) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/emissions/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Emission record deleted successfully.' });
        fetchEmissions();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to delete record.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while deleting record.' });
    }
  };

  const resetForm = () => {
    const def = DEFAULT_FACTORS.Electricity;
    setFormData({
      id: null,
      department: user?.department || 'General Sustainability',
      emissionSource: 'Electricity',
      scope: def.scope,
      activityValue: '',
      unit: def.unit,
      emissionFactor: def.factor,
      reportingPeriod: getCurrentPeriod(),
      notes: ''
    });
    setIsEditing(false);
  };

  // Real-time calculation preview: CO2e = Activity Value * Emission Factor
  const previewValue = Number(formData.activityValue) || 0;
  const previewFactor = Number(formData.emissionFactor) || 0;
  const calculatedPreview = (previewValue * previewFactor).toFixed(4);

  // Scope summary breakdown
  const scope1Total = emissions.filter(e => e.scope === 'Scope 1').reduce((a, b) => a + (b.calculatedCO2e || 0), 0);
  const scope2Total = emissions.filter(e => e.scope === 'Scope 2').reduce((a, b) => a + (b.calculatedCO2e || 0), 0);
  const scope3Total = emissions.filter(e => e.scope === 'Scope 3').reduce((a, b) => a + (b.calculatedCO2e || 0), 0);

  return (
    <div>
      {/* Title Banner */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>GHG Emission Accounting</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track and calculate greenhouse gas emissions across Scope 1, 2, and 3 activities
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowFormModal(true);
          }}
        >
          + Record Emission Data
        </button>
      </div>

      {/* Global Message Banner */}
      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL EMISSIONS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
            {totalCO2e.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emissions.length} Logged Entries</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>SCOPE 1 (DIRECT)</span>
          <h2 style={{ fontSize: '1.6rem', color: '#f59e0b', marginTop: '0.2rem' }}>
            {scope1Total.toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fuels & Direct Combustion</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>SCOPE 2 (ELECTRICITY)</span>
          <h2 style={{ fontSize: '1.6rem', color: '#38bdf8', marginTop: '0.2rem' }}>
            {scope2Total.toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Purchased Grid Energy</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>SCOPE 3 (INDIRECT)</span>
          <h2 style={{ fontSize: '1.6rem', color: '#a855f7', marginTop: '0.2rem' }}>
            {scope3Total.toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Travel, Waste & Supplies</span>
        </div>
      </div>

      {/* Record Emission Modal / Card */}
      {showFormModal && (
        <div className="card" style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="card-title">
              {isEditing ? 'Edit Emission Entry' : 'Log New Emission Activity'}
            </h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowFormModal(false);
                resetForm();
              }}
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Emission Source</label>
                <select
                  className="form-input"
                  value={formData.emissionSource}
                  onChange={handleSourceChange}
                >
                  <option value="Electricity">Electricity (Grid)</option>
                  <option value="Diesel">Diesel Fuel</option>
                  <option value="Petrol">Petrol / Gasoline</option>
                  <option value="Natural Gas">Natural Gas</option>
                  <option value="Transportation">Transportation / Fleet</option>
                  <option value="Waste">Solid Waste</option>
                  <option value="Water">Water Usage</option>
                  <option value="Other">Other / Custom Source</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Scope Classification</label>
                <select
                  className="form-input"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                >
                  <option value="Scope 1">Scope 1 (Direct Emissions)</option>
                  <option value="Scope 2">Scope 2 (Electricity/Heating)</option>
                  <option value="Scope 3">Scope 3 (Value Chain & Waste)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department / Facility</label>
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
                <label className="form-label">Consumption / Activity Value</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 1500"
                  value={formData.activityValue}
                  onChange={(e) => setFormData({ ...formData, activityValue: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit of Measurement</label>
                <select
                  className="form-input"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="kWh">kWh</option>
                  <option value="Liters">Liters</option>
                  <option value="Gallons">Gallons</option>
                  <option value="m3">m³ (Cubic Meters)</option>
                  <option value="km">km (Kilometers)</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="Metric Tons">Metric Tons</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Emission Factor (tCO₂e per unit)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 0.00085"
                  value={formData.emissionFactor}
                  onChange={(e) => setFormData({ ...formData, emissionFactor: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reporting Period (YYYY-MM)</label>
                <input
                  type="month"
                  className="form-input"
                  value={formData.reportingPeriod}
                  onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Activity Description / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Utility bill #8912 for Main Admin Building"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Transparent Calculation Explainer Box */}
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TRANSPARENT CALCULATION FORMULA:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  CO₂e = Activity Value ({previewValue || 0} {formData.unit}) × Emission Factor ({previewFactor})
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>CALCULATED RESULT</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>
                  = {calculatedPreview} <span style={{ fontSize: '0.9rem' }}>tCO₂e</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save Changes' : 'Record Emission'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', alignItems: 'center' }}>
          <div>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search notes or dept..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <select
              className="form-input"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            >
              <option value="">Filter by All Sources</option>
              <option value="Electricity">Electricity</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="Natural Gas">Natural Gas</option>
              <option value="Transportation">Transportation</option>
              <option value="Waste">Waste</option>
              <option value="Water">Water</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <select
              className="form-input"
              value={filters.scope}
              onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
            >
              <option value="">Filter by All Scopes</option>
              <option value="Scope 1">Scope 1 (Direct)</option>
              <option value="Scope 2">Scope 2 (Indirect Grid)</option>
              <option value="Scope 3">Scope 3 (Supply Chain)</option>
            </select>
          </div>

          <div>
            <input
              type="month"
              className="form-input"
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            />
          </div>

          <div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setFilters({ search: '', source: '', scope: '', period: '' })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Emission Records Data Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading emission logs...</p>
        ) : emissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No emission logs match your filter criteria.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Source</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Scope</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Department</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Activity Consumption</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Factor</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>CO₂e Emission</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Period</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Logged By</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emissions.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>
                    {item.emissionSource}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <span 
                      className="status-pill"
                      style={{
                        backgroundColor: item.scope === 'Scope 1' ? 'rgba(245, 158, 11, 0.15)' : item.scope === 'Scope 2' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                        color: item.scope === 'Scope 1' ? '#f59e0b' : item.scope === 'Scope 2' ? '#38bdf8' : '#c084fc'
                      }}
                    >
                      {item.scope}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>{item.department}</td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <strong>{item.activityValue?.toLocaleString()}</strong> {item.unit}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                    {item.emissionFactor}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {item.calculatedCO2e?.toFixed(4)} tCO₂e
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                    {item.reportingPeriod}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    {item.recordedBy?.name || 'Officer'}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditClick(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => handleDeleteClick(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Emissions;
