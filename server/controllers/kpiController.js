import KPI from '../models/KPI.js';
import KPIMeasurement from '../models/KPIMeasurement.js';
import { canAccessDepartment } from '../middleware/authMiddleware.js';

/**
 * Transparent Rule-Based KPI Status Calculation Engine
 * @param {string} category - KPI Category
 * @param {number} actualValue - Latest measured value
 * @param {number} targetValue - Benchmark target value
 * @returns {string} Rule-based status ('Achieved', 'On Track', 'At Risk', 'Off Track', 'Pending Data')
 */
export const calculateKPIStatus = (category, actualValue, targetValue) => {
  if (actualValue === null || actualValue === undefined || isNaN(actualValue)) {
    return 'Pending Data';
  }

  const isIncreaseGoal = category === 'Renewable Energy';

  if (isIncreaseGoal) {
    // Higher actual value is better (e.g., Renewable Energy Adoption %)
    if (actualValue >= targetValue) return 'Achieved';
    if (actualValue >= targetValue * 0.85) return 'On Track';
    if (actualValue >= targetValue * 0.70) return 'At Risk';
    return 'Off Track';
  } else {
    // Lower actual value is better (e.g., Emissions, Waste, Water, Energy Reduction Targets)
    if (actualValue <= targetValue) return 'Achieved';
    if (actualValue <= targetValue * 1.15) return 'On Track';
    if (actualValue <= targetValue * 1.30) return 'At Risk';
    return 'Off Track';
  }
};

/**
 * @desc    Get all sustainability KPIs with search, filters, & rule-based status evaluation
 * @route   GET /api/kpis
 * @access  Private (Authenticated users)
 */
export const getKPIs = async (req, res) => {
  try {
    const { category, status, department, search, frequency } = req.query;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (department) query.department = department;
    if (frequency) query.reportingFrequency = frequency;

    if (search) {
      query.$or = [
        { kpiName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const kpis = await KPI.find(query)
      .populate('createdBy', 'name email role department')
      .sort({ createdAt: -1 });

    // Evaluate rule-based status and attach latest measurement history info
    const evaluatedKPIs = await Promise.all(
      kpis.map(async (k) => {
        const latestMeasurement = await KPIMeasurement.findOne({ kpi: k._id })
          .sort({ createdAt: -1 })
          .populate('recordedBy', 'name email');

        let evalStatus = k.status;
        let currVal = k.currentValue;

        if (latestMeasurement) {
          currVal = latestMeasurement.actualValue;
          evalStatus = calculateKPIStatus(k.category, currVal, k.targetValue);

          // Sync status in DB if changed
          if (k.status !== evalStatus || k.currentValue !== currVal) {
            k.currentValue = currVal;
            k.status = evalStatus;
            await k.save();
          }
        }

        return {
          ...k.toObject(),
          latestMeasurement: latestMeasurement || null
        };
      })
    );

    // Aggregate summary stats
    const summary = {
      total: evaluatedKPIs.length,
      achieved: evaluatedKPIs.filter(k => k.status === 'Achieved').length,
      onTrack: evaluatedKPIs.filter(k => k.status === 'On Track').length,
      atRisk: evaluatedKPIs.filter(k => k.status === 'At Risk').length,
      offTrack: evaluatedKPIs.filter(k => k.status === 'Off Track').length,
      pending: evaluatedKPIs.filter(k => k.status === 'Pending Data').length
    };

    res.status(200).json({
      status: 'success',
      count: evaluatedKPIs.length,
      summary,
      kpis: evaluatedKPIs
    });
  } catch (error) {
    console.error('[Get KPIs Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch sustainability KPIs'
    });
  }
};

/**
 * @desc    Get single KPI with complete measurement history
 * @route   GET /api/kpis/:id
 * @access  Private
 */
export const getKPIById = async (req, res) => {
  try {
    const kpi = await KPI.findById(req.params.id).populate('createdBy', 'name email role');

    if (!kpi) {
      return res.status(404).json({
        status: 'error',
        message: 'KPI definition not found'
      });
    }

    if (!canAccessDepartment(req.user, kpi.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    const history = await KPIMeasurement.find({ kpi: kpi._id })
      .populate('recordedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      kpi,
      history
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch KPI details'
    });
  }
};

/**
 * @desc    Define a new sustainability KPI
 * @route   POST /api/kpis
 * @access  Private (Organization Admin only)
 */
export const createKPI = async (req, res) => {
  try {
    const {
      kpiName,
      category,
      description,
      unit,
      targetValue,
      reportingFrequency,
      department
    } = req.body;

    if (!kpiName || !category || !unit || targetValue === undefined || !department) {
      return res.status(400).json({
        status: 'error',
        message: 'Please fill in all required fields: name, category, unit, target value, and department.'
      });
    }

    const target = Number(targetValue);
    if (isNaN(target) || target < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Target value must be a valid non-negative number.'
      });
    }

    const kpi = await KPI.create({
      kpiName: kpiName.trim(),
      category,
      description: description ? description.trim() : '',
      unit: unit.trim(),
      targetValue: target,
      reportingFrequency: reportingFrequency || 'Monthly',
      department: department.trim(),
      status: 'Pending Data',
      createdBy: req.user._id
    });

    const populatedKPI = await KPI.findById(kpi._id).populate('createdBy', 'name email role');

    res.status(201).json({
      status: 'success',
      message: 'Sustainability KPI defined successfully',
      kpi: populatedKPI
    });
  } catch (error) {
    console.error('[Create KPI Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create KPI definition'
    });
  }
};

/**
 * @desc    Update KPI definition
 * @route   PUT /api/kpis/:id
 * @access  Private (Organization Admin only)
 */
export const updateKPI = async (req, res) => {
  try {
    const {
      kpiName,
      category,
      description,
      unit,
      targetValue,
      reportingFrequency,
      department
    } = req.body;

    const kpi = await KPI.findById(req.params.id);

    if (!kpi) {
      return res.status(404).json({
        status: 'error',
        message: 'KPI definition not found'
      });
    }

    if (!canAccessDepartment(req.user, kpi.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    if (kpiName) kpi.kpiName = kpiName.trim();
    if (category) kpi.category = category;
    if (description !== undefined) kpi.description = description.trim();
    if (unit) kpi.unit = unit.trim();
    if (targetValue !== undefined) kpi.targetValue = Number(targetValue);
    if (reportingFrequency) kpi.reportingFrequency = reportingFrequency;
    if (department) kpi.department = department.trim();

    // Re-evaluate rule-based status with updated target
    if (kpi.currentValue !== null && kpi.currentValue !== undefined) {
      kpi.status = calculateKPIStatus(kpi.category, kpi.currentValue, kpi.targetValue);
    }

    const updatedKPI = await kpi.save();
    const populatedKPI = await KPI.findById(updatedKPI._id).populate('createdBy', 'name email role');

    res.status(200).json({
      status: 'success',
      message: 'KPI definition updated successfully',
      kpi: populatedKPI
    });
  } catch (error) {
    console.error('[Update KPI Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update KPI definition'
    });
  }
};

/**
 * @desc    Delete KPI definition and its measurements
 * @route   DELETE /api/kpis/:id
 * @access  Private (Organization Admin only)
 */
export const deleteKPI = async (req, res) => {
  try {
    const kpi = await KPI.findById(req.params.id);

    if (!kpi) {
      return res.status(404).json({
        status: 'error',
        message: 'KPI definition not found'
      });
    }

    // Delete associated measurements
    await KPIMeasurement.deleteMany({ kpi: kpi._id });
    await kpi.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'KPI and its measurement history deleted successfully'
    });
  } catch (error) {
    console.error('[Delete KPI Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete KPI'
    });
  }
};

/**
 * @desc    Record a new actual measurement value for a KPI
 * @route   POST /api/kpis/:id/measurements
 * @access  Private (Authenticated users)
 */
export const addKPIMeasurement = async (req, res) => {
  try {
    const { reportingPeriod, actualValue, notes } = req.body;

    const kpi = await KPI.findById(req.params.id);

    if (!kpi) {
      return res.status(404).json({
        status: 'error',
        message: 'KPI definition not found'
      });
    }

    if (!reportingPeriod || actualValue === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide reporting period and actual measured value.'
      });
    }

    const val = Number(actualValue);
    if (isNaN(val)) {
      return res.status(400).json({
        status: 'error',
        message: 'Actual value must be a valid number.'
      });
    }

    // Create measurement log
    const measurement = await KPIMeasurement.create({
      kpi: kpi._id,
      reportingPeriod: reportingPeriod.trim(),
      actualValue: val,
      notes: notes ? notes.trim() : '',
      recordedBy: req.user._id
    });

    // Update KPI current value and evaluate rule-based status
    kpi.currentValue = val;
    kpi.status = calculateKPIStatus(kpi.category, val, kpi.targetValue);
    await kpi.save();

    const populatedMeasurement = await KPIMeasurement.findById(measurement._id).populate(
      'recordedBy',
      'name email role'
    );

    res.status(201).json({
      status: 'success',
      message: 'KPI measurement logged successfully',
      measurement: populatedMeasurement,
      updatedKPI: kpi
    });
  } catch (error) {
    console.error('[Add Measurement Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to record KPI measurement'
    });
  }
};

/**
 * @desc    Get measurement history for a KPI
 * @route   GET /api/kpis/:id/measurements
 * @access  Private
 */
export const getKPIMeasurements = async (req, res) => {
  try {
    const kpi = await KPI.findById(req.params.id).select('department');
    if (!kpi) {
      return res.status(404).json({ status: 'error', message: 'KPI definition not found' });
    }
    if (!canAccessDepartment(req.user, kpi.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    const measurements = await KPIMeasurement.find({ kpi: req.params.id })
      .populate('recordedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: measurements.length,
      measurements
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch measurement history'
    });
  }
};
