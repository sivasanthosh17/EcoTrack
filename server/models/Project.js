import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a project description'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Please specify a department'],
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Please select a start date']
    },
    targetCompletionDate: {
      type: Date,
      required: [true, 'Please select a target completion date']
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: 0
    },
    expectedCarbonReduction: {
      type: Number,
      required: [true, 'Please specify expected annual carbon reduction (in tCO2e)'],
      min: [0, 'Expected reduction cannot be negative']
    },
    actualCarbonReduction: {
      type: Number,
      min: [0, 'Actual reduction cannot be negative'],
      default: 0
    },
    progressPercentage: {
      type: Number,
      min: [0, 'Progress percentage cannot be less than 0'],
      max: [100, 'Progress percentage cannot exceed 100'],
      default: 0
    },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'On Hold'],
      default: 'Planned'
    },
    notes: {
      type: String,
      trim: true
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

const Project = mongoose.model('Project', projectSchema);

export default Project;
