import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecotrack_db';
    await mongoose.connect(mongoURI);

    console.log('[Seed] Connected to MongoDB database...');

    // Delete pre-existing demo users to reset seed state
    await User.deleteMany({ email: { $in: ['admin@ecotrack.org', 'officer@ecotrack.org'] } });

    // Create default demo users
    const admin = await User.create({
      name: 'Organization Admin',
      email: 'admin@ecotrack.org',
      password: 'admin123',
      role: 'Organization Admin',
      department: 'Sustainability Leadership'
    });

    const officer = await User.create({
      name: 'Department Officer',
      email: 'officer@ecotrack.org',
      password: 'officer123',
      role: 'Department Officer',
      department: 'Facilities & Energy'
    });

    console.log('[Seed] Default demo accounts created successfully:');
    console.log(`  1. Admin:   ${admin.email}   | Password: admin123  | Role: ${admin.role}`);
    console.log(`  2. Officer: ${officer.email} | Password: officer123 | Role: ${officer.role}`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error.message);
    console.warn('[Seed Help] Ensure local MongoDB is running or update MONGODB_URI in server/.env');
    process.exit(1);
  }
};

seedUsers();
