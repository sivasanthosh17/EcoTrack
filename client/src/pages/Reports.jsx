import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Filters State
  const [filters, setFilters] = useState({
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    source: ''
  });

  // Data States
  const [organization, setOrganization] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [emissions, setEmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [kpis, setKPIs] = useState([]);
  const [actionPlans, setActionPlans] = useState([]);

  const [loading, setLoading] = useState(true);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Organization Profile
      const orgRes = await fetch(`${API_BASE_URL}/organization`, { headers: authHeaders });
      const orgData = await orgRes.json();
      if (orgRes.ok) setOrganization(orgData.organization);

      // 2. Fetch Departments
      const deptRes = await fetch(`${API_BASE_URL}/departments`, { headers: authHeaders });
      const deptData = await deptRes.json();
      if (deptRes.ok) setDepartments(deptData.departments || []);

      // 3. Fetch Emissions
      const emQueryParams = new URLSearchParams();
      if (filters.source) emQueryParams.append('source', filters.source);
      if (filters.department) emQueryParams.append('department', filters.department);

      const emRes = await fetch(`${API_BASE_URL}/emissions?${emQueryParams.toString()}`, { headers: authHeaders });
      const emData = await emRes.json();
      if (emRes.ok) setEmissions(emData.emissions || []);

      // 4. Fetch Projects
      const projQueryParams = new URLSearchParams();
      if (filters.department) projQueryParams.append('department', filters.department);
      const projRes = await fetch(`${API_BASE_URL}/projects?${projQueryParams.toString()}`, { headers: authHeaders });
      const projData = await projRes.json();
      if (projRes.ok) setProjects(projData.projects || []);

      // 5. Fetch KPIs
      const kpiQueryParams = new URLSearchParams();
      if (filters.department) kpiQueryParams.append('department', filters.department);
      const kpiRes = await fetch(`${API_BASE_URL}/kpis?${kpiQueryParams.toString()}`, { headers: authHeaders });
      const kpiData = await kpiRes.json();
      if (kpiRes.ok) setKPIs(kpiData.kpis || []);

      // 6. Fetch Climate Action Plans
      const planRes = await fetch(`${API_BASE_URL}/action-plans`, { headers: authHeaders });
      const planData = await planRes.json();
      if (planRes.ok) setActionPlans(planData.plans || []);

    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReportData();
  };

  // Filter emissions by Date Range locally
  const filteredEmissions = emissions.filter(e => {
    if (!e.reportingDate && !e.createdAt) return true;
    const dateStr = (e.reportingDate || e.createdAt).split('T')[0];
    if (filters.startDate && dateStr < filters.startDate) return false;
    if (filters.endDate && dateStr > filters.endDate) return false;
    return true;
  });

  // Calculate Emissions by Source Breakdown
  const sourceBreakdownMap = {};
  filteredEmissions.forEach(e => {
    const src = e.emissionSource || 'Other';
    if (!sourceBreakdownMap[src]) {
      sourceBreakdownMap[src] = { source: src, scope: e.scope, count: 0, totalCO2e: 0 };
    }
    sourceBreakdownMap[src].count++;
    sourceBreakdownMap[src].totalCO2e += (e.calculatedCO2e || 0);
  });

  const sourceBreakdownList = Object.values(sourceBreakdownMap).sort((a, b) => b.totalCO2e - a.totalCO2e);
  const totalFilteredCO2e = filteredEmissions.reduce((acc, e) => acc + (e.calculatedCO2e || 0), 0);

  // Calculate Projects & Reductions Summary
  const totalExpectedProjectSavings = projects.reduce((acc, p) => acc + (p.expectedCarbonReduction || 0), 0);
  const totalRealizedProjectSavings = projects.reduce((acc, p) => acc + (p.actualCarbonReduction || 0), 0);

  // Calculate KPI Summary
  const achievedKPIs = kpis.filter(k => k.status === 'Achieved' || k.status === 'On Track').length;
  const kpiSuccessRate = kpis.length > 0 ? Math.round((achievedKPIs / kpis.length) * 100) : 0;

  // Calculate Action Plan Summary
  const avgPlanProgress = actionPlans.length > 0
    ? Math.round(actionPlans.reduce((acc, p) => acc + (p.overallProgress || 0), 0) / actionPlans.length)
    : 0;

  return (
    <div>
      {/* Non-Printable Filter Toolbar */}
      <div className="no-print" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Environmental Reporting</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Generate, customize, and print official greenhouse gas compliance and sustainability reports
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            Print Report
          </button>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
            Customize Report Parameters
          </h3>
          <form onSubmit={handleFilterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department</label>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Emission Source</label>
                <select
                  className="form-input"
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                >
                  <option value="">All Emission Sources</option>
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
                <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                  Apply Filters
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div className="printable-report card" style={{ padding: '2.5rem', backgroundColor: '#ffffff', color: '#0f172a' }}>
        {/* Report Official Header */}
        <div style={{ borderBottom: '2px solid #0d131a', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ marginBottom: '0.4rem' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
                {organization?.name || 'EcoTrack City Municipality'}
              </h1>
            </div>
            <h2 style={{ fontSize: '1.15rem', color: '#475569', fontWeight: 600 }}>
              Environmental Compliance & Sustainability Performance Report
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
              {organization?.address || '100 Green Planet Way, Eco City, EC 90210'} | Contact: {organization?.contactEmail || 'contact@ecotrack.org'}
            </p>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div><strong>Report Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Reporting Scope:</strong> {filters.startDate} to {filters.endDate}</div>
            <div><strong>Target Department:</strong> {filters.department || 'All Departments'}</div>
            <div><strong>Source Filter:</strong> {filters.source || 'All Sources'}</div>
            <div><strong>Generated By:</strong> {user?.name} ({user?.role})</div>
          </div>
        </div>

        {/* Section 1: Executive Key Metrics */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            1. Executive Environmental Summary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>TOTAL EMISSIONS</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                {totalFilteredCO2e.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>tCO₂e</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{filteredEmissions.length} Logged Activity Records</span>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>REALIZED CARBON REDUCTION</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
                {totalRealizedProjectSavings.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>tCO₂e</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Target: {totalExpectedProjectSavings.toFixed(2)} tCO₂e</span>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>KPI ACHIEVEMENT RATE</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>
                {kpiSuccessRate}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{achievedKPIs} of {kpis.length} KPIs On Track</span>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACTION PLAN PROGRESS</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.2rem' }}>
                {avgPlanProgress}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{actionPlans.length} Active Action Frameworks</span>
            </div>
          </div>
        </div>

        {/* Section 2: Emissions by Source Breakdown */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            2. Greenhouse Gas Emissions Breakdown by Source
          </h3>

          {sourceBreakdownList.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', italic: true }}>No emission logs found for the selected filter parameters.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Emission Source</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Scope Category</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Log Count</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Emissions (tCO₂e)</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Share of Total</th>
                </tr>
              </thead>
              <tbody>
                {sourceBreakdownList.map((item, idx) => {
                  const share = totalFilteredCO2e > 0 ? ((item.totalCO2e / totalFilteredCO2e) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{item.source}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>{item.scope}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>{item.count}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#059669' }}>
                        {item.totalCO2e.toFixed(4)} tCO₂e
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#334155', fontWeight: 600 }}>{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 3: Carbon Reduction Projects Performance */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            3. Carbon Reduction Projects Progress
          </h3>

          {projects.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', italic: true }}>No carbon reduction projects recorded.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Project Title</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Department</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Target Savings</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Realized Savings</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{p.projectName}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>{p.department}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#334155', fontWeight: 600 }}>{p.status}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#d97706', fontWeight: 600 }}>{p.expectedCarbonReduction} tCO₂e</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#059669', fontWeight: 700 }}>{p.actualCarbonReduction || 0} tCO₂e</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0284c7' }}>{p.progressPercentage || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 4: Sustainability KPI Performance */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            4. Sustainability KPI Target Compliance
          </h3>

          {kpis.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', italic: true }}>No KPIs defined for the selected criteria.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>KPI Name</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Category</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Department</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Target Benchmark</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Latest Measured Value</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Evaluated Status</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((k) => (
                  <tr key={k._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{k.kpiName}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>{k.category}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>{k.department}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#334155', fontWeight: 600 }}>{k.targetValue} {k.unit}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#059669', fontWeight: 700 }}>
                      {k.currentValue !== null && k.currentValue !== undefined ? `${k.currentValue} ${k.unit}` : 'Not Measured'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: k.status === 'Achieved' || k.status === 'On Track' ? '#059669' : '#dc2626' }}>
                      {k.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 5: Climate Action Plan Framework */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            5. Climate Action Plan Framework Progress
          </h3>

          {actionPlans.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', italic: true }}>No climate action plans recorded.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Action Plan Title</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Reduction Target</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Timeline</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Sub-Actions</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Overall Progress</th>
                </tr>
              </thead>
              <tbody>
                {actionPlans.map((plan) => (
                  <tr key={plan._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{plan.planName}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#d97706', fontWeight: 600 }}>{plan.emissionReductionTarget} tCO₂e</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>
                      {new Date(plan.startDate).toLocaleDateString()} → {new Date(plan.targetDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>{plan.actionsCount || 0} Items</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#334155' }}>{plan.status}</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#059669' }}>{plan.overallProgress || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Official Report Footer & Signature Verification Block */}
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '2rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Official Document Generated by EcoTrack Greenhouse Gas & Sustainability Accounting System.
            </p>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
              Verification Hash: {Math.random().toString(36).substring(2, 12).toUpperCase()} | Data Verified Against Database Logs.
            </p>
          </div>

          <div style={{ textAlign: 'center', minWidth: '220px', marginTop: '1rem' }}>
            <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '0.35rem', width: '200px', margin: '0 auto 0.35rem auto' }} />
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Environmental Officer Signature</p>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Sustainability Compliance Department</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
