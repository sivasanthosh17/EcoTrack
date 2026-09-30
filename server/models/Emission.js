import mongoose from 'mongoose';

const emissionSchema = new mongoose.Schema(
  {
    organization: {
      type: String,
      default: 'EcoTrack City Municipality'
    },
    department: {
      type: String,
      required: [true, 'Please select or specify a department'],
      trim: true
    },
    emissionSource: {
      type: String,
      enum: ['Electricity', 'Diesel', 'Petrol', 'Natural Gas', 'Transportation', 'Waste', 'Water', 'Other'],
      required: [true, 'Please select an emission source']
    },
    scope: {
      type: String,
      enum: ['Scope 1', 'Scope 2', 'Scope 3'],
      default: 'Scope 1'
    },
    activityValue: {
      type: Number,
      required: [true, 'Please provide an activity/consumption value'],
      min: [0, 'Activity value cannot be negative']
    },
    unit: {
      type: String,
      enum: ['kWh', 'Liters', 'Gallons', 'm3', 'km', 'kg', 'Metric Tons'],
      required: [true, 'Please specify a measurement unit']
    },
    emissionFactor: {
      type: Number,
      required: [true, 'Please specify an emission factor'],
      min: [0, 'Emission factor cannot be negative']
    },
    calculatedCO2e: {
      type: Number,
      required: true // Stored value = activityValue * emissionFactor
    },
    reportingPeriod: {
      type: String,
      required: [true, 'Please provide a reporting period (e.g. 2026-09)'],
      trim: true
    },
    reportingDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Emission = mongoose.model('Emission', emissionSchema);

export default Emission;
