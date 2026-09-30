import Emission from '../models/Emission.js';
import { canAccessDepartment } from '../middleware/authMiddleware.js';

// Standardized GHG Emission Factors (in metric tons CO2e per activity unit)
export const DEFAULT_EMISSION_FACTORS = {
  Electricity: { factor: 0.00085, unit: 'kWh', scope: 'Scope 2', label: 'Grid Electricity (0.85 kg CO2e/kWh)' },
  Diesel: { factor: 0.00268, unit: 'Liters', scope: 'Scope 1', label: 'Diesel Fuel (2.68 kg CO2e/Liter)' },
  Petrol: { factor: 0.00231, unit: 'Liters', scope: 'Scope 1', label: 'Motor Gasoline (2.31 kg CO2e/Liter)' },
  'Natural Gas': { factor: 0.0019, unit: 'm3', scope: 'Scope 1', label: 'Natural Gas (1.90 kg CO2e/m³)' },
  Transportation: { factor: 0.00017, unit: 'km', scope: 'Scope 3', label: 'Fleet & Commute (0.17 kg CO2e/km)' },
  Waste: { factor: 0.0005, unit: 'kg', scope: 'Scope 3', label: 'Solid Waste (0.50 kg CO2e/kg)' },
  Water: { factor: 0.0003, unit: 'm3', scope: 'Scope 3', label: 'Water Supply (0.30 kg CO2e/m³)' },
  Other: { factor: 0.0010, unit: 'Metric Tons', scope: 'Scope 3', label: 'Custom Activity' }
};

/**
 * @desc    Get all emission records with filtering & search
 * @route   GET /api/emissions
 * @access  Private (Authenticated users)
 */
export const getEmissions = async (req, res) => {
  try {
    const { source, scope, period, search, department } = req.query;

    const query = {};

    if (source) query.emissionSource = source;
    if (scope) query.scope = scope;
    if (department) query.department = department;

    // Monthly/Yearly period filter (e.g., '2026-09' or '2026')
    if (period) {
      query.reportingPeriod = { $regex: `^${period}`, $options: 'i' };
    }

    // Text search in notes or department
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { emissionSource: { $regex: search, $options: 'i' } }
      ];
    }

    const emissions = await Emission.find(query)
      .populate('recordedBy', 'name email role department')
      .sort({ reportingDate: -1, createdAt: -1 });

    // Aggregate summary totals
    const totalCO2e = emissions.reduce((acc, item) => acc + (item.calculatedCO2e || 0), 0);

    res.status(200).json({
      status: 'success',
      count: emissions.length,
      totalCO2e: Number(totalCO2e.toFixed(4)),
      emissions
    });
  } catch (error) {
    console.error('[Get Emissions Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch emission records'
    });
  }
};

/**
 * @desc    Get standard emission factor definitions
 * @route   GET /api/emissions/factors
 * @access  Private
 */
export const getEmissionFactors = async (req, res) => {
  res.status(200).json({
    status: 'success',
    factors: DEFAULT_EMISSION_FACTORS
  });
};

/**
 * @desc    Record a new emission log
 * @route   POST /api/emissions
 * @access  Private
 */
export const createEmission = async (req, res) => {
  try {
    const {
      organization,
      department,
      emissionSource,
      scope,
      activityValue,
      unit,
      emissionFactor,
      reportingPeriod,
      notes
    } = req.body;

    if (!department || !emissionSource || activityValue === undefined || !unit || emissionFactor === undefined || !reportingPeriod) {
      return res.status(400).json({
        status: 'error',
        message: 'Please fill in all required fields: department, source, activity value, unit, factor, and reporting period.'
      });
    }

    const val = Number(activityValue);
    const factor = Number(emissionFactor);

    if (isNaN(val) || val < 0) {
      return res.status(400).json({ status: 'error', message: 'Activity value must be a valid positive number.' });
    }

    if (isNaN(factor) || factor < 0) {
      return res.status(400).json({ status: 'error', message: 'Emission factor must be a valid positive number.' });
    }

    // Transparent calculation formula: CO2e = Activity Value * Emission Factor
    const calculatedCO2e = Number((val * factor).toFixed(4));

    // Auto-determine scope if not explicitly passed
    const defaultScope = DEFAULT_EMISSION_FACTORS[emissionSource]?.scope || 'Scope 1';
    const assignedScope = scope || defaultScope;

    const emission = await Emission.create({
      organization: organization || 'EcoTrack City Municipality',
      department: department.trim(),
      emissionSource,
      scope: assignedScope,
      activityValue: val,
      unit,
      emissionFactor: factor,
      calculatedCO2e,
      reportingPeriod: reportingPeriod.trim(),
      notes: notes ? notes.trim() : '',
      recordedBy: req.user._id
    });

    const populatedEmission = await Emission.findById(emission._id).populate(
      'recordedBy',
      'name email role department'
    );

    res.status(201).json({
      status: 'success',
      message: 'Emission record logged successfully',
      emission: populatedEmission
    });
  } catch (error) {
    console.error('[Create Emission Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to record emission entry'
    });
  }
};

/**
 * @desc    Update an emission log
 * @route   PUT /api/emissions/:id
 * @access  Private
 */
export const updateEmission = async (req, res) => {
  try {
    const {
      department,
      emissionSource,
      scope,
      activityValue,
      unit,
      emissionFactor,
      reportingPeriod,
      notes
    } = req.body;

    const emission = await Emission.findById(req.params.id);

    if (!emission) {
      return res.status(404).json({
        status: 'error',
        message: 'Emission record not found'
      });
    }

    if (!canAccessDepartment(req.user, emission.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    if (department) emission.department = department.trim();
    if (emissionSource) emission.emissionSource = emissionSource;
    if (scope) emission.scope = scope;
    if (activityValue !== undefined) emission.activityValue = Number(activityValue);
    if (unit) emission.unit = unit;
    if (emissionFactor !== undefined) emission.emissionFactor = Number(emissionFactor);
    if (reportingPeriod) emission.reportingPeriod = reportingPeriod.trim();
    if (notes !== undefined) emission.notes = notes.trim();

    // Recalculate CO2e
    emission.calculatedCO2e = Number((emission.activityValue * emission.emissionFactor).toFixed(4));

    const updatedEmission = await emission.save();
    const populatedEmission = await Emission.findById(updatedEmission._id).populate(
      'recordedBy',
      'name email role department'
    );

    res.status(200).json({
      status: 'success',
      message: 'Emission record updated successfully',
      emission: populatedEmission
    });
  } catch (error) {
    console.error('[Update Emission Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update emission record'
    });
  }
};

/**
 * @desc    Delete an emission log
 * @route   DELETE /api/emissions/:id
 * @access  Private
 */
export const deleteEmission = async (req, res) => {
  try {
    const emission = await Emission.findById(req.params.id);

    if (!emission) {
      return res.status(404).json({
        status: 'error',
        message: 'Emission record not found'
      });
    }

    if (!canAccessDepartment(req.user, emission.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    await emission.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Emission record deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Emission Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete emission record'
    });
  }
};
