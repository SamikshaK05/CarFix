import express from 'express';
import { getServiceManagerDashboard } from '../controllers/serviceManagerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('SERVICE_MANAGER'), getServiceManagerDashboard);

export default router;
