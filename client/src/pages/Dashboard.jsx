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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics || {});
        setCharts(data.charts || {});
        setRecentActivity(data.recentActivity || []);
      } else {
        setError(data.message || 'Failed to load dashboard metrics.');
      }
    } catch (err) {
      setError('Could not connect to Express server.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Title & Live Status Banner */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Executive Sustainability Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time analytics and consolidated environmental performance indicators derived from MongoDB APIs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardStats}>
            Refresh
          </button>
          <span className="status-pill online">
            <span className="pulse-dot"></span> Live DB Sync
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* 5 Real-Time Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL CO₂e EMISSIONS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
            {loading ? '...' : metrics.totalCO2e?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{metrics.totalEmissionLogsCount || 0} Logged Entries</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL CARBON REDUCTION</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
            {loading ? '...' : metrics.totalCarbonReduction?.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>tCO₂e</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Realized Savings</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>ACTIVE REDUCTION PROJECTS</span>
          <h2 style={{ fontSize: '1.8rem', color: '#f59e0b', marginTop: '0.2rem' }}>
            {loading ? '...' : metrics.activeProjectsCount}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>out of {metrics.totalProjectsCount || 0} Total Projects</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>KPI ACHIEVEMENT RATE</span>
          <h2 style={{ fontSize: '1.8rem', color: '#38bdf8', marginTop: '0.2rem' }}>
            {loading ? '...' : metrics.kpiAchievementPercentage}%
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Achieved / On Track KPIs</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>ACTION PLAN PROGRESS</span>
          <h2 style={{ fontSize: '1.8rem', color: '#a855f7', marginTop: '0.2rem' }}>
            {loading ? '...' : metrics.climateActionPlanProgress}%
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Framework Rate</span>
        </div>
      </div>

      {/* 4 Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Chart 1: Emission Trend by Month */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Emission Trend by Month/Period
          </h3>
          <div style={{ height: '280px', position: 'relative' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '5rem' }}>Loading chart data...</p>
            ) : (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Chart 2: Emissions by Source */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Emissions Breakdown by Source
          </h3>
          <div style={{ height: '280px', position: 'relative' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '5rem' }}>Loading chart data...</p>
            ) : (
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            )}
          </div>
        </div>

        {/* Chart 3: Carbon Reduction by Project */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Carbon Reduction by Project (Target vs Realized)
          </h3>
          <div style={{ height: '280px', position: 'relative' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '5rem' }}>Loading chart data...</p>
            ) : (
              <Bar data={projectBarData} options={projectBarOptions} />
            )}
          </div>
        </div>

        {/* Chart 4: KPI Performance Distribution */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Sustainability KPI Performance Status
          </h3>
          <div style={{ height: '280px', position: 'relative' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '5rem' }}>Loading chart data...</p>
            ) : (
              <Bar data={kpiBarData} options={kpiBarOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Recent System Activity Stream */}
      <div className="card">
        <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent audit activity logs recorded yet.</p>
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
