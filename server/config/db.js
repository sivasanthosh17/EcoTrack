import mongoose from 'mongoose';
import User from '../models/User.js';

let mongoMemoryInstance = null;
let connectionPromise = null;

const onVercel = Boolean(process.env.VERCEL);

/**
 * Connect to MongoDB database instance using Mongoose.
 * Locally, falls back to an embedded In-Memory MongoDB server if no local or Atlas database is available.
 * On Vercel there is no fallback: MONGODB_URI must point to a hosted database such as MongoDB Atlas.
 */
const openConnection = async () => {
  if (onVercel && !process.env.MONGODB_URI) {
    console.error('[Database Error] MONGODB_URI is not set. Add your MongoDB Atlas connection string in the Vercel project settings.');
    return false;
  }

  const primaryURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecotrack_db';
  const isHostedDatabase = onVercel || primaryURI.startsWith('mongodb+srv://');

  try {
    // Attempt connecting to primary MongoDB instance (local or Atlas)
    const conn = await mongoose.connect(primaryURI, {
      // A hosted database needs longer to answer the first time than a local one
      serverSelectionTimeoutMS: isHostedDatabase ? 10000 : 2000
    });
    console.log(`[Database] Connected to MongoDB Server: ${conn.connection.host}`);
    await seedDemoAccounts();
    return true;
  } catch (primaryError) {
    if (onVercel) {
      console.error(`[Database Error] Could not connect to MONGODB_URI (${primaryError.message}). Check the connection string and that Atlas Network Access allows 0.0.0.0/0.`);
      return false;
    }

    console.warn(`[Database Info] Local/External MongoDB not detected (${primaryError.message}).`);
    console.log(`[Database Info] Starting embedded In-Memory MongoDB Server...`);

    try {
      // Launch In-Memory MongoDB Server automatically (local development only)
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryInstance = await MongoMemoryServer.create();
      const inMemoryURI = mongoMemoryInstance.getUri();

      await mongoose.connect(inMemoryURI);
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
 * Starts the database connection once and shares it between requests.
 * A failed attempt is forgotten, so the next request tries again.
 */
export const connectDB = () => {
  if (!connectionPromise) {
    connectionPromise = openConnection().then((connected) => {
      if (!connected) connectionPromise = null;
      return connected;
    });
  }
  return connectionPromise;
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
        department: 'Electrical'
      });
      console.log(`[Database Seed] Default demo accounts ready: admin@ecotrack.org / officer@ecotrack.org`);
    }
  } catch (err) {
    console.error('[Database Seed Warning]', err.message);
  }
};

/**
 * Middleware to check database connection status before handling API requests.
 * Waits for the first connection, which matters on Vercel where each cold start connects again.
 */
export const checkDbConnection = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[Database Error]', err.message);
    }
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      message: 'Database is initializing or offline. Please try again in a few seconds.'
    });
  }
  next();
};

export default connectDB;
