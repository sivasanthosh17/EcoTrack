import Emission from '../models/Emission.js';
import Project from '../models/Project.js';
import KPI from '../models/KPI.js';
import KPIMeasurement from '../models/KPIMeasurement.js';
import ActionPlan from '../models/ActionPlan.js';
import PlanAction from '../models/PlanAction.js';

/**
 * @desc    Get aggregated real-time EcoTrack dashboard metrics & chart data
 * @route   GET /api/dashboard/stats
 * @access  Private (Authenticated users)
 */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total CO2e Emissions Aggregation
    const emissionTotalAgg = await Emission.aggregate([
      { $group: { _id: null, totalCO2e: { $sum: '$calculatedCO2e' }, count: { $sum: 1 } } }
    ]);
    const totalCO2e = emissionTotalAgg[0] ? Number(emissionTotalAgg[0].totalCO2e.toFixed(2)) : 0;
    const totalEmissionLogsCount = emissionTotalAgg[0] ? emissionTotalAgg[0].count : 0;

    // 2. Emissions Breakdown by Source
    const sourceBreakdown = await Emission.aggregate([
      { $group: { _id: '$emissionSource', totalCO2e: { $sum: '$calculatedCO2e' }, count: { $sum: 1 } } },
      { $sort: { totalCO2e: -1 } }
    ]);

    const emissionsBySource = {
      labels: sourceBreakdown.map(item => item._id),
      data: sourceBreakdown.map(item => Number(item.totalCO2e.toFixed(2)))
    };

    // 3. Monthly Emission Trend
    const monthlyTrendAgg = await Emission.aggregate([
      { $group: { _id: '$reportingPeriod', totalCO2e: { $sum: '$calculatedCO2e' } } },
      { $sort: { _id: 1 } }
    ]);

    const emissionTrend = {
      labels: monthlyTrendAgg.map(item => item._id),
      data: monthlyTrendAgg.map(item => Number(item.totalCO2e.toFixed(2)))
    };

    // 4. Carbon Reduction Projects Aggregation
    const projects = await Project.find().sort({ createdAt: -1 });
    const planActions = await PlanAction.find();

    const activeProjectsCount = projects.filter(p => p.status === 'In Progress' || p.status === 'Planned').length;
    const projectActualReductionSum = projects.reduce((acc, p) => acc + (p.actualCarbonReduction || 0), 0);
    const actionActualReductionSum = planActions.reduce((acc, a) => acc + (a.actualCarbonReduction || 0), 0);
    const totalCarbonReduction = Number((projectActualReductionSum + actionActualReductionSum).toFixed(2));

    const projectReductionChart = {
      labels: projects.map(p => p.projectName.length > 20 ? p.projectName.substring(0, 18) + '...' : p.projectName),
      expectedData: projects.map(p => p.expectedCarbonReduction || 0),
      actualData: projects.map(p => p.actualCarbonReduction || 0)
    };

    // 5. KPI Performance Aggregation
    const kpis = await KPI.find();
    const kpiStatusCounts = {
      Achieved: 0,
      'On Track': 0,
      'At Risk': 0,
      'Off Track': 0,
      'Pending Data': 0
    };

    kpis.forEach(k => {
      const st = k.status || 'Pending Data';
      if (kpiStatusCounts[st] !== undefined) {
        kpiStatusCounts[st]++;
      } else {
        kpiStatusCounts['Pending Data']++;
      }
    });

    const successfulKPIs = kpiStatusCounts.Achieved + kpiStatusCounts['On Track'];
    const kpiAchievementPercentage = kpis.length > 0
      ? Math.round((successfulKPIs / kpis.length) * 100)
      : 0;

    const kpiPerformanceChart = {
      labels: Object.keys(kpiStatusCounts),
      data: Object.values(kpiStatusCounts)
    };

    // 6. Climate Action Plan Progress Aggregation
    const actionPlans = await ActionPlan.find();
    const climateActionPlanProgress = actionPlans.length > 0
      ? Math.round(actionPlans.reduce((acc, p) => acc + (p.overallProgress || 0), 0) / actionPlans.length)
      : 0;

    // 7. Recent System Activity Stream
    const recentEmissions = await Emission.find()
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(4);

    const recentMeasurements = await KPIMeasurement.find()
      .populate('kpi', 'kpiName unit')
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(4);

    const recentActivity = [
      ...recentEmissions.map(e => ({
        id: `em-${e._id}`,
        type: 'Emission Logged',
        title: `${e.emissionSource} (${e.activityValue} ${e.unit})`,
        detail: `${e.calculatedCO2e.toFixed(2)} tCO2e logged for ${e.department}`,
        timestamp: e.createdAt,
        user: e.recordedBy?.name || 'Officer'
      })),
      ...recentMeasurements.map(m => ({
        id: `kpi-${m._id}`,
        type: 'KPI Measurement',
        title: m.kpi?.kpiName || 'KPI Measurement',
        detail: `Actual measured: ${m.actualValue} ${m.kpi?.unit || ''} for period ${m.reportingPeriod}`,
        timestamp: m.createdAt,
        user: m.recordedBy?.name || 'Officer'
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);

    res.status(200).json({
      status: 'success',
      metrics: {
        totalCO2e,
        totalCarbonReduction,
        activeProjectsCount,
        kpiAchievementPercentage,
        climateActionPlanProgress,
        totalEmissionLogsCount,
        totalProjectsCount: projects.length,
        totalKPIsCount: kpis.length,
        totalActionPlansCount: actionPlans.length
      },
      charts: {
        emissionsBySource,
        emissionTrend,
        projectReductionChart,
        kpiPerformanceChart
      },
      recentActivity
    });
  } catch (error) {
    console.error('[Dashboard Controller Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to compute dashboard metrics'
    });
  }
};
