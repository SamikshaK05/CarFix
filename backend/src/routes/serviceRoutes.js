import express from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/:id', getServiceById);

// Protected routes (Admin & Service Manager)
router.post('/', protect, authorize('ADMIN', 'SERVICE_MANAGER'), createService);
router.put('/:id', protect, authorize('ADMIN', 'SERVICE_MANAGER'), updateService);
router.delete('/:id', protect, authorize('ADMIN', 'SERVICE_MANAGER'), deleteService);

export default router;
