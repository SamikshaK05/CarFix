import express from 'express';
import { getMechanicDashboard } from '../controllers/mechanicController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('MECHANIC'), getMechanicDashboard);

export default router;
