import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';

let mongoMemoryInstance = null;

/**
 * Connect to MongoDB database instance using Mongoose.
 * Automatically falls back to an embedded In-Memory MongoDB server if no local or Atlas database is available.
 */
export const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecotrack_db';

  try {
    // Attempt connecting to primary MongoDB instance (local or Atlas)
    const conn = await mongoose.connect(primaryURI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[Database] Connected to MongoDB Server: ${conn.connection.host}`);
    await seedDemoAccounts();
    return true;
  } catch (primaryError) {
    console.warn(`[Database Info] Local/External MongoDB not detected (${primaryError.message}).`);
    console.log(`[Database Info] Starting embedded In-Memory MongoDB Server...`);

    try {
      // Launch In-Memory MongoDB Server automatically
      mongoMemoryInstance = await MongoMemoryServer.create();
      const inMemoryURI = mongoMemoryInstance.getUri();

      const conn = await mongoose.connect(inMemoryURI);
      console.log(`[Database] In-Memory MongoDB Connected Successfully!`);

      // Seed initial demo accounts
      await seedDemoAccounts();

      return true;
    } catch (memError) {
      console.error(`[Database Error] Failed to start In-Memory MongoDB: ${memError.message}`);
      return false;
    }
  }
};

/**
 * Helper to auto-seed demo accounts in database if not already existing
 */
const seedDemoAccounts = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@ecotrack.org' });
    if (!adminExists) {
      await User.create({
        name: 'Organization Admin',
        email: 'admin@ecotrack.org',
        password: 'admin123',
        role: 'Organization Admin',
        department: 'Sustainability Leadership'
      });
      await User.create({
        name: 'Department Officer',
        email: 'officer@ecotrack.org',
        password: 'officer123',
        role: 'Department Officer',
        department: 'Facilities & Energy'
      });
      console.log(`[Database Seed] Default demo accounts ready: admin@ecotrack.org / officer@ecotrack.org`);
    }
  } catch (err) {
    console.error('[Database Seed Warning]', err.message);
  }
};

/**
 * Middleware to check database connection status before handling API requests
 */
export const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      message: 'Database is initializing or offline. Please try again in a few seconds.'
    });
  }
  next();
};

export default connectDB;
