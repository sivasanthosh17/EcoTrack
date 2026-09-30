import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an organization name'],
      trim: true,
      default: 'EcoTrack City Municipality'
    },
    orgType: {
      type: String,
      enum: ['Municipality', 'Corporate Enterprise', 'Educational Institution', 'Non-Profit', 'Government Agency'],
      default: 'Municipality'
    },
    address: {
      type: String,
      trim: true,
      default: '100 Green Planet Way, Eco City, EC 90210'
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'contact@ecotrack.org'
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '+1 (555) 019-2831'
    },
    website: {
      type: String,
      trim: true,
      default: 'https://ecotrack.org'
    }
  },
  {
    timestamps: true
  }
);

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
