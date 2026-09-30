import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a department name'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Please provide a department code (e.g. ENV-01)'],
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Campus'
    }
  },
  {
    timestamps: true
  }
);

const Department = mongoose.model('Department', departmentSchema);

export default Department;
