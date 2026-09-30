import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, checkDbConnection } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import emissionRoutes from './routes/emissionRoutes.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes with DB Health Middleware
app.use('/api/auth', checkDbConnection, authRoutes);
app.use('/api/organization', checkDbConnection, organizationRoutes);
app.use('/api/departments', checkDbConnection, departmentRoutes);
app.use('/api/emissions', checkDbConnection, emissionRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStates = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const dbState = dbStates[mongoose.connection.readyState] || 'Unknown';

  res.status(200).json({
    status: 'online',
    message: 'EcoTrack API Server is running smoothly',
    database: dbState,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] EcoTrack backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
