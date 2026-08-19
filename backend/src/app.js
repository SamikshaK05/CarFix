import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import serviceRoutes from './routes/serviceRoutes.js';
import serviceCenterRoutes from './routes/serviceCenterRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import serviceManagerRoutes from './routes/serviceManagerRoutes.js';
import mechanicRoutes from './routes/mechanicRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS for frontend communication
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// Express body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const databaseStatus = dbStateMap[mongoose.connection.readyState] || 'disconnected';

  res.status(200).json({
    success: true,
    message: 'CarFix API is running',
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/dashboard/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/service-manager', serviceManagerRoutes);
app.use('/api/mechanic', mechanicRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-centers', serviceCenterRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 Not Found Middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;
