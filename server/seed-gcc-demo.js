import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Emission from './models/Emission.js';
import Project from './models/Project.js';
import KPI from './models/KPI.js';
import KPIMeasurement from './models/KPIMeasurement.js';
import ActionPlan from './models/ActionPlan.js';
import PlanAction from './models/PlanAction.js';

dotenv.config();

const DEMO_NOTE = 'Illustrative GCC demo data - replace with verified source records.';
const DEMO_PREFIX = '[GCC DEMO]';

const seedGccDemoData = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecotrack_db';
    await mongoose.connect(mongoURI);

    const admin = await User.findOne({ email: 'admin@ecotrack.org' });
    if (!admin) {
      throw new Error('Seed the default users first with npm run seed.');
    }

    const officer = await User.findOne({ email: 'officer@ecotrack.org' }) || admin;

    const demoPlans = await ActionPlan.find({ planName: { $regex: `^${DEMO_PREFIX}` } }).select('_id');
    await PlanAction.deleteMany({ plan: { $in: demoPlans.map((plan) => plan._id) } });
    await ActionPlan.deleteMany({ _id: { $in: demoPlans.map((plan) => plan._id) } });
    await KPIMeasurement.deleteMany({ notes: DEMO_NOTE });
    await KPI.deleteMany({ description: DEMO_NOTE });
    await Emission.deleteMany({ notes: DEMO_NOTE });
    await Project.deleteMany({ notes: DEMO_NOTE });

    const emissions = [
      {
        organization: 'Greater Chennai Corporation',
        department: 'Electrical',
        emissionSource: 'Electricity',
        scope: 'Scope 2',
        activityValue: 125000,
        unit: 'kWh',
        emissionFactor: 0.00085,
        calculatedCO2e: 106.25,
        reportingPeriod: '2026-09',
        notes: DEMO_NOTE,
        recordedBy: officer._id
      },
      {
        organization: 'Greater Chennai Corporation',
        department: 'Roads',
        emissionSource: 'Diesel',
        scope: 'Scope 1',
        activityValue: 18500,
        unit: 'Liters',
        emissionFactor: 0.00268,
        calculatedCO2e: 49.58,
        reportingPeriod: '2026-09',
        notes: DEMO_NOTE,
        recordedBy: officer._id
      },
      {
        organization: 'Greater Chennai Corporation',
        department: 'Solid Waste Management',
        emissionSource: 'Waste',
        scope: 'Scope 3',
        activityValue: 42000,
        unit: 'kg',
        emissionFactor: 0.0005,
        calculatedCO2e: 21,
        reportingPeriod: '2026-09',
        notes: DEMO_NOTE,
        recordedBy: officer._id
      },
      {
        organization: 'Greater Chennai Corporation',
        department: 'Storm Water Drain',
        emissionSource: 'Electricity',
        scope: 'Scope 2',
        activityValue: 54000,
        unit: 'kWh',
        emissionFactor: 0.00085,
        calculatedCO2e: 45.9,
        reportingPeriod: '2026-09',
        notes: DEMO_NOTE,
        recordedBy: officer._id
      }
    ];
    await Emission.insertMany(emissions);

    const projects = [
      {
        projectName: `${DEMO_PREFIX} LED retrofit for civic facilities`,
        description: 'Illustrative project for replacing high-use civic lighting with efficient LED systems.',
        department: 'Electrical',
        startDate: '2026-04-01',
        targetCompletionDate: '2027-03-31',
        budget: 2500000,
        expectedCarbonReduction: 85,
        actualCarbonReduction: 18,
        progressPercentage: 35,
        status: 'In Progress',
        notes: DEMO_NOTE,
        createdBy: admin._id
      },
      {
        projectName: `${DEMO_PREFIX} Source segregation improvement`,
        description: 'Illustrative project for improving wet and dry waste segregation across civic facilities.',
        department: 'Solid Waste Management',
        startDate: '2026-05-01',
        targetCompletionDate: '2026-12-31',
        budget: 1800000,
        expectedCarbonReduction: 60,
        actualCarbonReduction: 24,
        progressPercentage: 50,
        status: 'In Progress',
        notes: DEMO_NOTE,
        createdBy: admin._id
      },
      {
        projectName: `${DEMO_PREFIX} Storm-water pumping efficiency review`,
        description: 'Illustrative project for reviewing pump schedules and energy performance.',
        department: 'Storm Water Drain',
        startDate: '2026-06-01',
        targetCompletionDate: '2027-05-31',
        budget: 1200000,
        expectedCarbonReduction: 40,
        actualCarbonReduction: 8,
        progressPercentage: 20,
        status: 'In Progress',
        notes: DEMO_NOTE,
        createdBy: admin._id
      }
    ];
    await Project.insertMany(projects);

    const kpis = await KPI.insertMany([
      {
        kpiName: `${DEMO_PREFIX} Civic electricity consumption`,
        category: 'Energy',
        description: DEMO_NOTE,
        unit: 'kWh',
        targetValue: 115000,
        reportingFrequency: 'Monthly',
        department: 'Electrical',
        currentValue: 125000,
        status: 'At Risk',
        createdBy: admin._id
      },
      {
        kpiName: `${DEMO_PREFIX} Waste segregation rate`,
        category: 'Waste',
        description: DEMO_NOTE,
        unit: '%',
        targetValue: 75,
        reportingFrequency: 'Monthly',
        department: 'Solid Waste Management',
        currentValue: 62,
        status: 'At Risk',
        createdBy: admin._id
      },
      {
        kpiName: `${DEMO_PREFIX} Pumping energy intensity`,
        category: 'Energy',
        description: DEMO_NOTE,
        unit: 'kWh per ML',
        targetValue: 100,
        reportingFrequency: 'Quarterly',
        department: 'Storm Water Drain',
        currentValue: 92,
        status: 'Achieved',
        createdBy: admin._id
      }
    ]);

    await KPIMeasurement.insertMany(
      kpis.map((kpi) => ({
        kpi: kpi._id,
        reportingPeriod: '2026-09',
        actualValue: kpi.currentValue,
        notes: DEMO_NOTE,
        recordedBy: officer._id
      }))
    );

    const plan = await ActionPlan.create({
      planName: `${DEMO_PREFIX} Chennai civic operations climate action plan`,
      description: 'Illustrative climate action plan connecting energy, waste, and drainage improvements.',
      startDate: '2026-04-01',
      targetDate: '2027-03-31',
      emissionReductionTarget: 185,
      status: 'In Progress',
      overallProgress: 42,
      department: 'Electrical',
      createdBy: admin._id
    });

    await PlanAction.insertMany([
      {
        plan: plan._id,
        actionName: `${DEMO_PREFIX} Complete LED facility survey`,
        description: 'Illustrative survey action for identifying high-use lighting assets.',
        responsibleDepartment: 'Electrical',
        startDate: '2026-04-01',
        targetDate: '2026-08-31',
        expectedCarbonReduction: 25,
        actualCarbonReduction: 18,
        progressPercentage: 70,
        status: 'In Progress',
        createdBy: admin._id
      },
      {
        plan: plan._id,
        actionName: `${DEMO_PREFIX} Expand source segregation pilots`,
        description: 'Illustrative action for extending wet and dry waste segregation pilots.',
        responsibleDepartment: 'Solid Waste Management',
        startDate: '2026-05-01',
        targetDate: '2026-12-31',
        expectedCarbonReduction: 60,
        actualCarbonReduction: 24,
        progressPercentage: 40,
        status: 'In Progress',
        createdBy: admin._id
      }
    ]);

    console.log('[GCC Demo Seed] Loaded illustrative emissions, projects, KPIs, measurements, and action plans.');
    console.log('[GCC Demo Seed] Replace records marked with the demo note using verified GCC data before production use.');
  } catch (error) {
    console.error('[GCC Demo Seed Error]', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedGccDemoData();
