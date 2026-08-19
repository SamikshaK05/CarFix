import express from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  updateAdminUserStatus,
  deleteAdminUser,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

// User list & view routes accessible by ADMIN and SERVICE_MANAGER
router.get('/users', authorize('ADMIN', 'SERVICE_MANAGER'), getAdminUsers);
router.get('/users/:id', authorize('ADMIN', 'SERVICE_MANAGER'), getAdminUserById);

// Admin-only operations below
router.use(authorize('ADMIN'));

// Dashboard route
router.get('/dashboard', getAdminDashboard);

// User mutation routes
router.put('/users/:id', updateAdminUser);
router.patch('/users/:id/status', updateAdminUserStatus);
router.delete('/users/:id', deleteAdminUser);

export default router;
