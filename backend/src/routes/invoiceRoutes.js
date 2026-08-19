import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  downloadInvoice,
  createInvoice,
  updateInvoice,
  updatePaymentStatus,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getInvoices);
router.get('/:id/download', downloadInvoice);
router.get('/:id', getInvoiceById);
router.post('/', authorize('ADMIN', 'SERVICE_MANAGER'), createInvoice);
router.put('/:id', authorize('ADMIN', 'SERVICE_MANAGER'), updateInvoice);
router.patch('/:id/payment-status', authorize('ADMIN', 'SERVICE_MANAGER'), updatePaymentStatus);

export default router;
