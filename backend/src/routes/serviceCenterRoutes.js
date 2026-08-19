import express from 'express';
import {
  getServiceCenters,
  getServiceCenterById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
} from '../controllers/serviceCenterController.js';
import { getReviews, createReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper middleware to adapt params to query/body for /:id/reviews routes
const mapCenterReviewsQuery = (req, res, next) => {
  req.query.serviceCenter = req.params.id;
  next();
};

const mapCenterReviewsBody = (req, res, next) => {
  req.body.serviceCenter = req.params.id;
  next();
};

// Public routes
router.get('/', getServiceCenters);
router.get('/:id', getServiceCenterById);
router.get('/:id/reviews', mapCenterReviewsQuery, getReviews);

// Customer review creation route
router.post('/:id/reviews', protect, mapCenterReviewsBody, createReview);

// Admin & Service Manager protected routes
router.post('/', protect, authorize('ADMIN', 'SERVICE_MANAGER'), createServiceCenter);
router.put('/:id', protect, authorize('ADMIN', 'SERVICE_MANAGER'), updateServiceCenter);
router.delete('/:id', protect, authorize('ADMIN', 'SERVICE_MANAGER'), deleteServiceCenter);

export default router;
