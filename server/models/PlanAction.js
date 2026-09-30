import mongoose from 'mongoose';

const planActionSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActionPlan',
      required: true
    },
    actionName: {
      type: String,
      required: [true, 'Please provide an action name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide an action description'],
      trim: true
    },
    responsibleDepartment: {
      type: String,
      required: [true, 'Please specify the responsible department'],
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
    expectedCarbonReduction: {
      type: Number,
      required: [true, 'Please specify expected carbon reduction (in tCO2e)'],
      min: [0, 'Expected reduction cannot be negative']
    },
    actualCarbonReduction: {
      type: Number,
      min: [0, 'Actual reduction cannot be negative'],
      default: 0
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'Delayed'],
      default: 'Planned'
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

const PlanAction = mongoose.model('PlanAction', planActionSchema);

export default PlanAction;
