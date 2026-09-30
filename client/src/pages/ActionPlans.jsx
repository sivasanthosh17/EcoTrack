import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_PILLS = {
  Planned: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  'In Progress': { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  Completed: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  Delayed: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
};

const ActionPlans = () => {
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const [plans, setPlans] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({
    totalPlans: 0,
    totalReductionTarget: 0,
    totalAchievedReduction: 0,
    avgOverallProgress: 0
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Expandable plan cards state
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // Plan Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    id: null,
    planName: '',
    description: '',
    startDate: '',
    targetDate: '',
    emissionReductionTarget: '',
    status: 'Planned'
  });

  // Action Modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [selectedPlanForAction, setSelectedPlanForAction] = useState(null);
  const [actionForm, setActionForm] = useState({
    id: null,
    actionName: '',
    description: '',
    responsibleDepartment: user?.department || 'General Sustainability',
    startDate: '',
    targetDate: '',
    expectedCarbonReduction: '',
    actualCarbonReduction: '0',
    progressPercentage: 0,
    status: 'Planned'
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchPlans();
    fetchDepartments();
  }, [filters]);

  const fetchPlans = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);

      const res = await fetch(`${API_BASE_URL}/action-plans?${queryParams.toString()}`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setPlans(data.plans || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load climate action plans', err);
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

  // Plan Submit
  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const url = isEditingPlan
      ? `${API_BASE_URL}/action-plans/${planForm.id}`
      : `${API_BASE_URL}/action-plans`;

    const method = isEditingPlan ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(planForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Climate Action Plan '${planForm.planName}' ${isEditingPlan ? 'updated' : 'created'} successfully!`
        });
        setShowPlanModal(false);
        resetPlanForm();
        fetchPlans();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Operation failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server communication error.' });
    }
  };

  // Delete Plan Trigger
  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete climate action plan '${name}' and all sub-actions?`)) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/action-plans/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Plan '${name}' deleted successfully.` });
        fetchPlans();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to delete plan.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while deleting plan.' });
    }
  };

  // Action Submit
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanForAction) return;
    setMessage({ type: '', text: '' });

    const url = isEditingAction
      ? `${API_BASE_URL}/action-plans/actions/${actionForm.id}`
      : `${API_BASE_URL}/action-plans/${selectedPlanForAction._id}/actions`;

    const method = isEditingAction ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(actionForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Action '${actionForm.actionName}' ${isEditingAction ? 'updated' : 'added'} successfully!`
        });
        setShowActionModal(false);
        resetActionForm();
        fetchPlans();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Action operation failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while saving action.' });
    }
  };

  // Delete Action Trigger
  const handleDeleteAction = async (actionId, actionName) => {
    if (!window.confirm(`Are you sure you want to delete action item '${actionName}'?`)) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/action-plans/actions/${actionId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Action item '${actionName}' deleted.` });
        fetchPlans();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to delete action.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while deleting action.' });
    }
  };

  // Edit Plan Trigger
  const handleEditPlanClick = (plan) => {
    setPlanForm({
      id: plan._id,
      planName: plan.planName,
      description: plan.description,
      startDate: plan.startDate ? plan.startDate.split('T')[0] : '',
      targetDate: plan.targetDate ? plan.targetDate.split('T')[0] : '',
      emissionReductionTarget: plan.emissionReductionTarget,
      status: plan.status
    });
    setIsEditingPlan(true);
    setShowPlanModal(true);
  };

  // Add Action Trigger
  const handleOpenAddAction = (plan) => {
    setSelectedPlanForAction(plan);
    setActionForm({
      id: null,
      actionName: '',
      description: '',
      responsibleDepartment: user?.department || 'General Sustainability',
      startDate: plan.startDate ? plan.startDate.split('T')[0] : '',
      targetDate: plan.targetDate ? plan.targetDate.split('T')[0] : '',
      expectedCarbonReduction: '',
      actualCarbonReduction: '0',
      progressPercentage: 0,
      status: 'Planned'
    });
    setIsEditingAction(false);
    setShowActionModal(true);
  };

  // Edit Action Trigger
  const handleEditActionClick = (plan, act) => {
    setSelectedPlanForAction(plan);
    setActionForm({
      id: act._id,
      actionName: act.actionName,
      description: act.description,
      responsibleDepartment: act.responsibleDepartment,
      startDate: act.startDate ? act.startDate.split('T')[0] : '',
      targetDate: act.targetDate ? act.targetDate.split('T')[0] : '',
      expectedCarbonReduction: act.expectedCarbonReduction,
      actualCarbonReduction: act.actualCarbonReduction || 0,
      progressPercentage: act.progressPercentage || 0,
      status: act.status
    });
    setIsEditingAction(true);
    setShowActionModal(true);
  };

  const resetPlanForm = () => {
    setPlanForm({
      id: null,
      planName: '',
      description: '',
      startDate: '',
      targetDate: '',
      emissionReductionTarget: '',
      status: 'Planned'
    });
    setIsEditingPlan(false);
  };

  const resetActionForm = () => {
    setActionForm({
      id: null,
      actionName: '',
      description: '',
      responsibleDepartment: user?.department || 'General Sustainability',
      startDate: '',
      targetDate: '',
      expectedCarbonReduction: '',
      actualCarbonReduction: '0',
      progressPercentage: 0,
      status: 'Planned'
    });
    setIsEditingAction(false);
    setSelectedPlanForAction(null);
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Climate Action Plans</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Establish high-level decarbonization goals, execute sub-actions, and compute overall progress
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetPlanForm();
            setShowPlanModal(true);
          }}
        >
          + Create Action Plan
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>ACTION PLANS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {summary.totalPlans}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Decarbonization Frameworks</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL TARGET REDUCTION</span>
          <h2 style={{ fontSize: '1.8rem', color: '#f59e0b', marginTop: '0.2rem' }}>
            {summary.totalReductionTarget?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Planned Reduction Goal</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>REALIZED ACTION SAVINGS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
            {summary.totalAchievedReduction?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Reduction from Actions</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>AVG OVERALL PROGRESS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
            {summary.avgOverallProgress}%
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculated Action Completion Rate</span>
        </div>
      </div>

      {/* Create / Edit Plan Modal */}
      {showPlanModal && (
        <div className="card" style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="card-title">
              {isEditingPlan ? 'Edit Climate Action Plan' : 'Create New Climate Action Plan'}
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowPlanModal(false)}>✕ Close</button>
          </div>

          <form onSubmit={handlePlanSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Plan Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2030 Municipal Decarbonization & Clean Energy Roadmap"
                  value={planForm.planName}
                  onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Plan Description & Objectives</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Outline high-level climate commitments, scope, and key milestones..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={planForm.startDate}
                  onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Completion Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={planForm.targetDate}
                  onChange={(e) => setPlanForm({ ...planForm, targetDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emission Reduction Target (tCO₂e)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={planForm.emissionReductionTarget}
                  onChange={(e) => setPlanForm({ ...planForm, emissionReductionTarget: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plan Status</label>
                <select
                  className="form-input"
                  value={planForm.status}
                  onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary">
                {isEditingPlan ? 'Save Plan Changes' : 'Create Plan'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Sub-Action Modal */}
      {showActionModal && selectedPlanForAction && (
        <div className="card" style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="card-title">
              {isEditingAction ? 'Edit Sub-Action Item' : `Add Sub-Action to '${selectedPlanForAction.planName}'`}
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowActionModal(false)}>✕ Close</button>
          </div>

          <form onSubmit={handleActionSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Action Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Transition Municipal Fleet to 100% Electric Vehicles"
                  value={actionForm.actionName}
                  onChange={(e) => setActionForm({ ...actionForm, actionName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Action Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Replace 25 diesel buses with EV buses and install 10 DC fast chargers"
                  value={actionForm.description}
                  onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Responsible Department</label>
                <select
                  className="form-input"
                  value={actionForm.responsibleDepartment}
                  onChange={(e) => setActionForm({ ...actionForm, responsibleDepartment: e.target.value })}
                  required
                >
                  <option value="General Sustainability">General Sustainability</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={actionForm.startDate}
                  onChange={(e) => setActionForm({ ...actionForm, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Completion Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={actionForm.targetDate}
                  onChange={(e) => setActionForm({ ...actionForm, targetDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Reduction (tCO₂e)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 350"
                  value={actionForm.expectedCarbonReduction}
                  onChange={(e) => setActionForm({ ...actionForm, expectedCarbonReduction: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Realized Reduction (tCO₂e)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 120"
                  value={actionForm.actualCarbonReduction}
                  onChange={(e) => setActionForm({ ...actionForm, actualCarbonReduction: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Action Progress ({actionForm.progressPercentage}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="form-input"
                  style={{ accentColor: 'var(--primary)', padding: 0 }}
                  value={actionForm.progressPercentage}
                  onChange={(e) => setActionForm({ ...actionForm, progressPercentage: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Action Status</label>
                <select
                  className="form-input"
                  value={actionForm.status}
                  onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary">
                {isEditingAction ? 'Save Action Changes' : 'Add Action Item'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowActionModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem', alignItems: 'center' }}>
          <div>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search plan name..."
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
              <option value="">All Plan Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          <div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setFilters({ search: '', status: '' })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Action Plans Directory */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading climate action plans...</p>
      ) : plans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No climate action plans match your criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {plans.map((plan) => {
            const statusStyle = STATUS_PILLS[plan.status] || STATUS_PILLS.Planned;
            const isExpanded = expandedPlanId === plan._id;

            return (
              <div key={plan._id} className="card" style={{ borderLeft: `4px solid ${statusStyle.color}` }}>
                {/* Plan Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <h2 style={{ fontSize: '1.3rem' }}>{plan.planName}</h2>
                      <span
                        className="status-pill"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
                      >
                        {plan.status}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1rem' }}>
                      {plan.description}
                    </p>

                    {/* Overall Progress Bar */}
                    <div style={{ maxWidth: '480px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                          Calculated Overall Plan Progress ({plan.actionsCount || 0} Sub-Actions)
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{plan.overallProgress || 0}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${plan.overallProgress || 0}%`, 
                            backgroundColor: plan.status === 'Completed' ? 'var(--primary)' : 'var(--accent)',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plan Right Specs & Action Controls */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>REDUCTION TARGET</span>
                      <strong style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{plan.emissionReductionTarget} tCO₂e</strong>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      🗓️ {new Date(plan.startDate).toLocaleDateString()} → {new Date(plan.targetDate).toLocaleDateString()}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenAddAction(plan)}
                      >
                        + Add Action
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditPlanClick(plan)}
                      >
                        Edit Plan
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => handleDeletePlan(plan._id, plan.planName)}
                      >
                        Delete
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan._id)}
                      >
                        {isExpanded ? '▲ Hide Actions' : `▼ View Actions (${plan.actionsCount || 0})`}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Sub-Actions Directory */}
                {isExpanded && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.05rem', color: 'var(--accent)' }}>
                        Action Items & Sub-Projects ({plan.actions ? plan.actions.length : 0})
                      </h3>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenAddAction(plan)}
                      >
                        + Add Action Item
                      </button>
                    </div>

                    {!plan.actions || plan.actions.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', italic: true }}>
                        No sub-actions added to this plan yet. Click "+ Add Action" to assign action items.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                        {plan.actions.map((act) => {
                          const actStatusStyle = STATUS_PILLS[act.status] || STATUS_PILLS.Planned;

                          return (
                            <div 
                              key={act._id} 
                              style={{ 
                                backgroundColor: 'var(--bg-primary)', 
                                padding: '1rem', 
                                borderRadius: 'var(--radius-sm)', 
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: '240px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                  <strong style={{ fontSize: '1rem' }}>{act.actionName}</strong>
                                  <span 
                                    className="status-pill"
                                    style={{ backgroundColor: actStatusStyle.bg, color: actStatusStyle.color, border: `1px solid ${actStatusStyle.border}`, fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                                  >
                                    {act.status}
                                  </span>
                                </div>

                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                                  {act.description}
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                                  <span>🏢 Dept: <strong style={{ color: 'var(--text-main)' }}>{act.responsibleDepartment}</strong></span>
                                  <span>Target: <strong style={{ color: '#f59e0b' }}>{act.expectedCarbonReduction} tCO₂e</strong></span>
                                  <span>Realized: <strong style={{ color: 'var(--primary)' }}>{act.actualCarbonReduction || 0} tCO₂e</strong></span>
                                  <span>Dates: {new Date(act.startDate).toLocaleDateString()} → {new Date(act.targetDate).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* Progress Slider & Action Buttons */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                                <div style={{ flex: 1, textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                                    Progress: {act.progressPercentage}%
                                  </div>
                                  <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden', marginLeft: 'auto', marginTop: '0.2rem' }}>
                                    <div style={{ height: '100%', width: `${act.progressPercentage}%`, backgroundColor: 'var(--primary)' }} />
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleEditActionClick(plan, act)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                    onClick={() => handleDeleteAction(act._id, act.actionName)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionPlans;
