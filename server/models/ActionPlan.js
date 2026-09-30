import mongoose from 'mongoose';

const actionPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: [true, 'Please provide a plan name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a plan description'],
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Please select a start date']
    },
    targetDate: {
      type: Date,
      required: [true, 'Please select a target date']
    },
    emissionReductionTarget: {
      type: Number,
      required: [true, 'Please specify the emission reduction target (in tCO2e)'],
      min: [0, 'Target reduction cannot be negative']
    },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'Delayed'],
      default: 'Planned'
    },
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
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

const ActionPlan = mongoose.model('ActionPlan', actionPlanSchema);

export default ActionPlan;
