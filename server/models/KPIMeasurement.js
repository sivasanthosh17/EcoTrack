import mongoose from 'mongoose';

const kpiMeasurementSchema = new mongoose.Schema(
  {
    kpi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KPI',
      required: true
    },
    reportingPeriod: {
      type: String,
      required: [true, 'Please provide a reporting period (e.g. 2026-09 or 2026-Q3)'],
      trim: true
    },
    actualValue: {
      type: Number,
      required: [true, 'Please provide an actual measured value']
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

const KPIMeasurement = mongoose.model('KPIMeasurement', kpiMeasurementSchema);

export default KPIMeasurement;
