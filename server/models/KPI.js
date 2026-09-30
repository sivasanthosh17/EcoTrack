import mongoose from 'mongoose';

const kpiSchema = new mongoose.Schema(
  {
    kpiName: {
      type: String,
      required: [true, 'Please provide a KPI name'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Energy', 'Water', 'Waste', 'Transportation', 'Emissions', 'Renewable Energy'],
      required: [true, 'Please select a category']
    },
    description: {
      type: String,
      trim: true
    },
    unit: {
      type: String,
      required: [true, 'Please specify a unit of measurement (e.g. kWh, tCO2e, %, m3, kg)'],
      trim: true
    },
    targetValue: {
      type: Number,
      required: [true, 'Please provide a target value'],
      min: [0, 'Target value cannot be negative']
    },
    reportingFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Annual'],
      default: 'Monthly'
    },
    department: {
      type: String,
      required: [true, 'Please select a department'],
      trim: true
    },
    currentValue: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ['Achieved', 'On Track', 'At Risk', 'Off Track', 'Pending Data'],
      default: 'Pending Data'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const KPI = mongoose.model('KPI', kpiSchema);

export default KPI;
