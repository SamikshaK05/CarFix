import express from 'express';
import {
  getBookings,
  getServiceHistory,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  assignMechanic,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getBookings);
router.get('/history', getServiceHistory);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/assign-mechanic', authorize('ADMIN', 'SERVICE_MANAGER'), assignMechanic);
router.patch('/:id/status', authorize('ADMIN', 'SERVICE_MANAGER', 'MECHANIC'), updateBookingStatus);

export default router;
