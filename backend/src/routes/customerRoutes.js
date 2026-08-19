import express from 'express';
import { getCustomerDashboard } from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('CUSTOMER'), getCustomerDashboard);
router.get('/dashboard', protect, authorize('CUSTOMER'), getCustomerDashboard);

export default router;
