import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';

// Helper function to populate references
const populateInvoice = (query) => {
  return query
    .populate('user', 'name email phone')
    .populate('vehicle', 'make model registrationNumber')
    .populate('booking', 'bookingDate bookingTime status');
};

// Helper function to generate unique invoice number
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `CARFIX-${year}-${randomDigits}`;
};

// @desc    Get all invoices (enforces CUSTOMER ownership)
// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const { user, paymentStatus, booking } = req.query;
    const filter = {};

    if (req.user && req.user.role === 'CUSTOMER') {
      filter.user = req.user._id;
    } else if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
      }
      filter.user = user;
    }

    if (booking) {
      if (!mongoose.Types.ObjectId.isValid(booking)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID',
        });
      }
      filter.booking = booking;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const invoices = await populateInvoice(Invoice.find(filter).sort({ issuedAt: -1 }));

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error('Error in getInvoices:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get invoice by ID (enforces CUSTOMER ownership)
// @route   GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const invoice = await populateInvoice(Invoice.findById(id));

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      if (invoice.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this invoice',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Error in getInvoiceById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Create new invoice from completed booking
// @route   POST /api/invoices
export const createInvoice = async (req, res) => {
  try {
    const { booking, tax, paymentMethod } = req.body;

    if (!booking || !mongoose.Types.ObjectId.isValid(booking)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    // 1. Verify Booking exists
    const bookingDoc = await Booking.findById(booking).populate('service');
    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // 2. Verify Booking is COMPLETED
    if (bookingDoc.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Invoice can only be created for completed bookings',
      });
    }

    // 3. Check for existing invoice for this booking
    const existingInvoice = await Invoice.findOne({ booking });
    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: 'Invoice already exists for this booking',
      });
    }

    // Validate payment method if supplied
    const allowedMethods = ['CASH', 'CARD', 'UPI', 'RAZORPAY', 'OTHER'];
    if (paymentMethod && !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    // Derive service item
    const serviceName = bookingDoc.service ? bookingDoc.service.name : 'Car Repair Service';
    const itemPrice = bookingDoc.service ? bookingDoc.service.price : bookingDoc.amount || 0;

    const items = [
      {
        serviceName,
        quantity: 1,
        price: itemPrice,
        amount: itemPrice,
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    // Calculate tax: treats tax input as percentage (e.g. 18 = 18%) and computes monetary tax amount
    const taxRate = typeof tax === 'number' && tax >= 0 ? tax : 0;
    const taxAmount = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
    const total = subtotal + taxAmount;

    // Generate unique invoice number
    let invoiceNumber = generateInvoiceNumber();
    let numConflict = await Invoice.findOne({ invoiceNumber });
    while (numConflict) {
      invoiceNumber = generateInvoiceNumber();
      numConflict = await Invoice.findOne({ invoiceNumber });
    }

    const newInvoice = await Invoice.create({
      invoiceNumber,
      booking,
      user: bookingDoc.user,
      vehicle: bookingDoc.vehicle,
      items,
      subtotal,
      tax: taxAmount,
      total,
      paymentStatus: 'PENDING',
      paymentMethod: paymentMethod || 'CASH',
      issuedAt: new Date(),
    });

    const populatedInvoice = await populateInvoice(Invoice.findById(newInvoice._id));

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Invoice already exists for this booking',
      });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in createInvoice:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update invoice (paymentMethod only)
// @route   PUT /api/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const { paymentMethod } = req.body;

    const allowedMethods = ['CASH', 'CARD', 'UPI', 'RAZORPAY', 'OTHER'];
    if (paymentMethod !== undefined && !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    const updateData = {};
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    const updatedInvoice = await populateInvoice(
      Invoice.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    );

    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in updateInvoice:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update payment status
// @route   PATCH /api/invoices/:id/payment-status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const { paymentStatus } = req.body;

    const allowedStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status',
      });
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    invoice.paymentStatus = paymentStatus;
    await invoice.save();

    const populatedInvoice = await populateInvoice(Invoice.findById(invoice._id));

    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: populatedInvoice,
    });
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Download invoice PDF (enforces CUSTOMER ownership)
// @route   GET /api/invoices/:id/download
// @access  Private
export const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const invoice = await populateInvoice(Invoice.findById(id));

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      const invoiceUserId = invoice.user?._id ? invoice.user._id.toString() : invoice.user?.toString();
      if (invoiceUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this invoice',
        });
      }
    }

    const filename = `invoice-${invoice.invoiceNumber || invoice._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Document Header & Branding
    doc.fillColor('#1E293B').fontSize(20).text('CARFIX AUTOMOTIVE SERVICES', { align: 'left' });
    doc.fontSize(10).fillColor('#64748B').text('Professional Vehicle Repair & Maintenance', { align: 'left' });
    doc.moveDown(0.5);

    doc.fillColor('#2563EB').fontSize(14).text('TAX INVOICE', { align: 'right' });
    doc.fontSize(10).fillColor('#334155').text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
    const issueDateStr = invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    doc.text(`Date: ${issueDateStr}`, { align: 'right' });
    doc.text(`Payment Status: ${invoice.paymentStatus || 'PENDING'}`, { align: 'right' });
    doc.moveDown(1);

    // Horizontal Rule
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown(1);

    // Customer & Vehicle Information
    const infoY = doc.y;
    doc.fontSize(11).fillColor('#1E293B').text('CUSTOMER DETAILS', 40, infoY);
    doc.fontSize(9).fillColor('#475569');
    doc.text(`Name: ${invoice.user?.name || 'N/A'}`, 40, infoY + 18);
    doc.text(`Email: ${invoice.user?.email || 'N/A'}`, 40, infoY + 32);
    doc.text(`Phone: ${invoice.user?.phone || 'N/A'}`, 40, infoY + 46);

    doc.fontSize(11).fillColor('#1E293B').text('VEHICLE & SERVICE DETAILS', 300, infoY);
    doc.fontSize(9).fillColor('#475569');
    const vehStr = invoice.vehicle ? `${invoice.vehicle.make || ''} ${invoice.vehicle.model || ''} (${invoice.vehicle.registrationNumber || 'N/A'})` : 'N/A';
    doc.text(`Vehicle: ${vehStr}`, 300, infoY + 18);
    const bkStr = invoice.booking ? `${new Date(invoice.booking.bookingDate || Date.now()).toLocaleDateString('en-IN')} ${invoice.booking.bookingTime || ''}` : 'N/A';
    doc.text(`Service Schedule: ${bkStr}`, 300, infoY + 32);
    doc.text(`Payment Method: ${invoice.paymentMethod || 'CASH'}`, 300, infoY + 46);

    doc.moveDown(4);

    // Items Table Header
    const tableTop = doc.y + 15;
    doc.rect(40, tableTop, 510, 20).fill('#F1F5F9');
    doc.fillColor('#1E293B').fontSize(10).text('Service / Description', 50, tableTop + 5);
    doc.text('Qty', 320, tableTop + 5);
    doc.text('Rate', 380, tableTop + 5);
    doc.text('Amount', 470, tableTop + 5);

    let position = tableTop + 25;
    const items = invoice.items || [];
    items.forEach((item) => {
      doc.fillColor('#334155').fontSize(9);
      doc.text(item.serviceName || 'Service', 50, position);
      doc.text(String(item.quantity || 1), 320, position);
      doc.text(`Rs. ${(item.price || 0).toFixed(2)}`, 380, position);
      doc.text(`Rs. ${(item.amount || 0).toFixed(2)}`, 470, position);
      position += 20;
    });

    // Summary Totals
    position += 10;
    doc.moveTo(40, position).lineTo(550, position).strokeColor('#E2E8F0').stroke();
    position += 12;

    doc.fontSize(10).fillColor('#475569').text('Subtotal:', 380, position);
    doc.text(`Rs. ${(invoice.subtotal || 0).toFixed(2)}`, 470, position);
    position += 16;

    doc.text('Tax:', 380, position);
    doc.text(`Rs. ${(invoice.tax || 0).toFixed(2)}`, 470, position);
    position += 20;

    doc.fontSize(11).fillColor('#1E293B').text('Total Amount:', 360, position);
    doc.fontSize(11).fillColor('#2563EB').text(`Rs. ${(invoice.total || 0).toFixed(2)}`, 470, position);

    // Footer
    doc.moveDown(5);
    doc.fontSize(9).fillColor('#94A3B8').text('Thank you for choosing CarFix Automotive Services!', { align: 'center' });
    doc.text('For queries regarding this invoice, please contact support@carfix.com', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error in downloadInvoice:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server Error generating invoice PDF',
      });
    }
  }
};
