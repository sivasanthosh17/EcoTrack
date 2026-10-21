import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

const ChartEmptyState = ({ title, description }) => (
  <div className="dashboard-chart-empty">
    <div className="dashboard-chart-empty-mark">--</div>
    <strong>{title}</strong>
    <span>{description}</span>
  </div>
);

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const [metrics, setMetrics] = useState({
    totalCO2e: 0,
    totalCarbonReduction: 0,
    activeProjectsCount: 0,
    kpiAchievementPercentage: 0,
    climateActionPlanProgress: 0,
    totalEmissionLogsCount: 0,
    totalProjectsCount: 0,
    totalKPIsCount: 0,
    totalActionPlansCount: 0
  });

  const [charts, setCharts] = useState({
    emissionsBySource: { labels: [], data: [] },
    emissionTrend: { labels: [], data: [] },
    projectReductionChart: { labels: [], expectedData: [], actualData: [] },
    kpiPerformanceChart: { labels: [], data: [] }
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [organizationName, setOrganizationName] = useState('Organization');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [periodFilter]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError('');
    try {
      const [res, organizationRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/stats?period=${periodFilter}`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/organization`, { headers: authHeaders })
      ]);
      const data = await res.json();
      const organizationData = await organizationRes.json();
      if (res.ok) {
        setMetrics(data.metrics || {});
        setCharts(data.charts || {});
        setRecentActivity(data.recentActivity || []);
        if (organizationData.organization?.name) {
          setOrganizationName(organizationData.organization.name);
        }
      } else {
        setError(data.message || 'Failed to load dashboard metrics.');
      }
    } catch (err) {
      setError('Could not connect to Express server.');
    } finally {
      setLoading(false);
    }
  };

  const hasEmissionData = metrics.totalEmissionLogsCount > 0;
  const hasProjectData = metrics.totalProjectsCount > 0;
  const hasKPIData = metrics.totalKPIsCount > 0;
  const hasActionPlanData = metrics.totalActionPlansCount > 0;
  const hasAnyData = hasEmissionData || hasProjectData || hasKPIData || hasActionPlanData;
  const periodLabels = {
    all: 'All available periods',
    month: 'Current month',
    quarter: 'Current quarter',
    year: 'Current year'
  };
  const reductionRate = metrics.totalCO2e > 0
    ? Math.round((metrics.totalCarbonReduction / metrics.totalCO2e) * 100)
    : 0;

  // Chart 1 Options & Config: Emission Trend (Line Chart)
  const lineChartData = {
    labels: charts.emissionTrend.labels.length > 0 ? charts.emissionTrend.labels : ['No Data'],
    datasets: [
      {
        label: 'Monthly CO₂e Emissions (tCO₂e)',
        data: charts.emissionTrend.data.length > 0 ? charts.emissionTrend.data : [0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointRadius: 4
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  // Chart 2 Options & Config: Emissions by Source (Doughnut Chart)
  const doughnutChartData = {
    labels: charts.emissionsBySource.labels.length > 0 ? charts.emissionsBySource.labels : ['No Data Recorded'],
    datasets: [
      {
        data: charts.emissionsBySource.data.length > 0 ? charts.emissionsBySource.data : [1],
        backgroundColor: [
          '#38bdf8', '#f59e0b', '#34d399', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#64748b'
        ],
        borderWidth: 2,
        borderColor: '#141c26'
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } }
    }
  };

  // Chart 3 Options & Config: Carbon Reduction by Project (Grouped Bar Chart)
  const projectBarData = {
    labels: charts.projectReductionChart.labels.length > 0 ? charts.projectReductionChart.labels : ['No Projects'],
    datasets: [
      {
        label: 'Expected Target Savings (tCO₂e)',
        data: charts.projectReductionChart.expectedData.length > 0 ? charts.projectReductionChart.expectedData : [0],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderRadius: 4
      },
      {
        label: 'Realized Actual Savings (tCO₂e)',
        data: charts.projectReductionChart.actualData.length > 0 ? charts.projectReductionChart.actualData : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 4
      }
    ]
  };

  const projectBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  // Chart 4 Options & Config: KPI Performance Distribution (Bar Chart)
  const kpiBarData = {
    labels: charts.kpiPerformanceChart.labels.length > 0 ? charts.kpiPerformanceChart.labels : ['Achieved', 'On Track', 'At Risk', 'Off Track', 'Pending Data'],
    datasets: [
      {
        label: 'KPI Status Count',
        data: charts.kpiPerformanceChart.data.length > 0 ? charts.kpiPerformanceChart.data : [0, 0, 0, 0, 0],
        backgroundColor: ['#34d399', '#38bdf8', '#fbbf24', '#f87171', '#94a3b8'],
        borderRadius: 6
      }
    ]
  };

  const kpiBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div>
      {/* Dashboard heading and controls */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">{organizationName}</div>
          <h1>Executive Sustainability Dashboard</h1>
          <p>Environmental performance at a glance, scoped to your current access.</p>
          <div className="dashboard-context-row">
            <span>Reporting: <strong>{periodLabels[periodFilter]}</strong></span>
            <span>Scope: <strong>{user?.role === 'Organization Admin' ? 'Entire organization' : user?.department}</strong></span>
          </div>
        </div>
        <div className="dashboard-actions">
          <label className="dashboard-period-control">
            <span>Period</span>
            <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
              <option value="all">All periods</option>
              <option value="month">This month</option>
              <option value="quarter">This quarter</option>
              <option value="year">This year</option>
            </select>
          </label>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardStats}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {!loading && !hasAnyData && (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-mark">+</div>
          <div>
            <h2>No sustainability data for this view</h2>
            <p>Start by recording an emission, creating a project, or defining a KPI. Your dashboard will update here.</p>
          </div>
        </div>
      )}

      {/* 5 Real-Time Summary Metric Cards */}
      <div className="dashboard-metric-grid">
        <div className="card dashboard-metric-card dashboard-metric-primary">
          <div className="metric-card-top"><span className="metric-mark metric-mark-green">CO₂</span><span className="metric-kicker">EMISSIONS</span></div>
          <h2>
            {loading ? '...' : metrics.totalCO2e?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span className="metric-detail">{metrics.totalEmissionLogsCount || 0} logged entries</span>
        </div>

        <div className="card dashboard-metric-card">
          <div className="metric-card-top"><span className="metric-mark metric-mark-blue">↓</span><span className="metric-kicker">REDUCTION</span></div>
          <h2>
            {loading ? '...' : metrics.totalCarbonReduction?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span className="metric-detail metric-detail-accent">{reductionRate}% of recorded emissions</span>
        </div>

        <div className="card dashboard-metric-card">
          <div className="metric-card-top"><span className="metric-mark metric-mark-orange">P</span><span className="metric-kicker">PROJECTS</span></div>
          <h2>
            {loading ? '...' : metrics.activeProjectsCount}
          </h2>
          <span className="metric-detail">{metrics.totalProjectsCount || 0} total projects</span>
        </div>

        <div className="card dashboard-metric-card">
          <div className="metric-card-top"><span className="metric-mark metric-mark-cyan">K</span><span className="metric-kicker">KPI HEALTH</span></div>
          <h2>
            {loading ? '...' : metrics.kpiAchievementPercentage}%
          </h2>
          <span className="metric-detail">{metrics.totalKPIsCount || 0} tracked KPIs</span>
        </div>

        <div className="card dashboard-metric-card">
          <div className="metric-card-top"><span className="metric-mark metric-mark-purple">A</span><span className="metric-kicker">ACTION PLANS</span></div>
          <h2>
            {loading ? '...' : metrics.climateActionPlanProgress}%
          </h2>
          <span className="metric-detail">{metrics.totalActionPlansCount || 0} active plans</span>
        </div>
      </div>

      {/* 4 Visual Charts Grid */}
      <div className="dashboard-chart-grid">
        {/* Chart 1: Emission Trend by Month */}
        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-heading"><div><span className="chart-kicker">EMISSIONS</span><h3>Emission trend</h3></div><span className="chart-period">{periodLabels[periodFilter]}</span></div>
          <div className="dashboard-chart-frame">
            {loading ? (
              <ChartEmptyState title="Loading data" description="Fetching the selected reporting period." />
            ) : !hasEmissionData ? (
              <ChartEmptyState title="No emission records" description="Add records in Emissions to see a trend." />
            ) : (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Chart 2: Emissions by Source */}
        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-heading"><div><span className="chart-kicker">SOURCES</span><h3>Emissions by source</h3></div><span className="chart-period">{periodLabels[periodFilter]}</span></div>
          <div className="dashboard-chart-frame">
            {loading ? (
              <ChartEmptyState title="Loading data" description="Fetching the selected reporting period." />
            ) : !hasEmissionData ? (
              <ChartEmptyState title="No source data" description="Source totals appear after emissions are recorded." />
            ) : (
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            )}
          </div>
        </div>

        {/* Chart 3: Carbon Reduction by Project */}
        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-heading"><div><span className="chart-kicker">PROJECT DELIVERY</span><h3>Target vs realized reduction</h3></div></div>
          <div className="dashboard-chart-frame">
            {loading ? (
              <ChartEmptyState title="Loading data" description="Fetching project performance." />
            ) : !hasProjectData ? (
              <ChartEmptyState title="No projects yet" description="Create a reduction project to compare delivery." />
            ) : (
              <Bar data={projectBarData} options={projectBarOptions} />
            )}
          </div>
        </div>

        {/* Chart 4: KPI Performance Distribution */}
        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-heading"><div><span className="chart-kicker">PERFORMANCE</span><h3>KPI health distribution</h3></div></div>
          <div className="dashboard-chart-frame">
            {loading ? (
              <ChartEmptyState title="Loading data" description="Fetching KPI performance." />
            ) : !hasKPIData ? (
              <ChartEmptyState title="No KPIs defined" description="Define a KPI to start tracking performance." />
            ) : (
              <Bar data={kpiBarData} options={kpiBarOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Recent System Activity Stream */}
      <div className="card">
        <div className="dashboard-activity-heading"><div><span className="chart-kicker">AUDIT TRAIL</span><h3>Recent activity</h3></div><span className="chart-period">{periodLabels[periodFilter]}</span></div>
        {recentActivity.length === 0 ? (
          <div className="dashboard-activity-empty">No activity recorded for this reporting period.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="brand-badge">{act.type}</span>
                    <strong style={{ fontSize: '0.95rem' }}>{act.title}</strong>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{act.detail}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <div>Logged by <strong>{act.user}</strong></div>
                  <div>{new Date(act.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
