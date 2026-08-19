import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Service from '../models/Service.js';
import ServiceCenter from '../models/ServiceCenter.js';
import Invoice from '../models/Invoice.js';

// Helper function to populate all references
const populateBooking = (query) => {
  return query
    .populate('user', 'name email phone')
    .populate('vehicle', 'make model registrationNumber')
    .populate('service', 'name category price duration')
    .populate('serviceCenter', 'name city address phone')
    .populate('mechanic', 'name email phone avatar');
};

// Helper function to check if a date is in the past
const isPastDate = (dateVal) => {
  const inputDate = new Date(dateVal);
  if (isNaN(inputDate.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(inputDate);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
};

// @desc    Get all bookings (enforces CUSTOMER & SERVICE_MANAGER ownership)
// @route   GET /api/bookings
export const getBookings = async (req, res) => {
  try {
    const { user, status, serviceCenter } = req.query;
    const filter = {};

    if (req.user && req.user.role === 'CUSTOMER') {
      filter.user = req.user._id;
    } else if (req.user && req.user.role === 'SERVICE_MANAGER' && req.user.serviceCenter) {
      const mgrCenter = req.user.serviceCenter._id ? req.user.serviceCenter._id.toString() : req.user.serviceCenter.toString();
      filter.serviceCenter = mgrCenter;
    } else if (req.user && req.user.role === 'MECHANIC') {
      filter.mechanic = req.user._id;
    } else if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
      }
      filter.user = user;
    }

    if (serviceCenter && (!req.user || req.user.role !== 'SERVICE_MANAGER' || !req.user.serviceCenter)) {
      if (!mongoose.Types.ObjectId.isValid(serviceCenter)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid service center ID',
        });
      }
      filter.serviceCenter = serviceCenter;
    }

    if (status) {
      filter.status = status;
    }

    const bookings = await populateBooking(
      Booking.find(filter).sort({ bookingDate: -1, bookingTime: -1 })
    );

    const bookingIds = bookings.map((b) => b._id);
    const invoices = await Invoice.find({ booking: { $in: bookingIds } }).lean();
    const invoiceMap = new Map();
    invoices.forEach((inv) => {
      if (inv.booking) invoiceMap.set(inv.booking.toString(), inv);
    });

    const data = bookings.map((b) => {
      const bObj = b.toObject ? b.toObject() : { ...b };
      const inv = invoiceMap.get(b._id.toString());
      if (inv) {
        bObj.invoice = {
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          paymentStatus: inv.paymentStatus,
          paymentMethod: inv.paymentMethod,
          total: inv.total,
        };
      }
      return bObj;
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error in getBookings:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get completed service history for authenticated customer
// @route   GET /api/bookings/history
// @access  Private
export const getServiceHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    const filter = { status: 'COMPLETED' };

    if (req.user && req.user.role === 'CUSTOMER') {
      filter.user = req.user._id;
    } else if (req.query.user) {
      if (!mongoose.Types.ObjectId.isValid(req.query.user)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
      }
      filter.user = req.query.user;
    }

    const bookings = await populateBooking(
      Booking.find(filter).sort({ bookingDate: -1, createdAt: -1 })
    );

    const bookingIds = bookings.map((b) => b._id);
    const invoices = await Invoice.find({ booking: { $in: bookingIds } }).lean();
    const invoiceMap = new Map();
    invoices.forEach((inv) => {
      if (inv.booking) invoiceMap.set(inv.booking.toString(), inv);
    });

    const data = bookings.map((b) => {
      const bObj = b.toObject ? b.toObject() : { ...b };
      const inv = invoiceMap.get(b._id.toString());
      if (inv) {
        bObj.invoice = {
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          paymentStatus: inv.paymentStatus,
          paymentMethod: inv.paymentMethod,
          total: inv.total,
        };
      }
      return bObj;
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error in getServiceHistory:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get booking by ID (enforces CUSTOMER & SERVICE_MANAGER ownership)
// @route   GET /api/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const booking = await populateBooking(Booking.findById(id));

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      if (booking.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this booking',
        });
      }
    }

    // Ownership check for SERVICE_MANAGER role
    if (req.user && req.user.role === 'SERVICE_MANAGER' && req.user.serviceCenter) {
      const mgrCenter = req.user.serviceCenter._id ? req.user.serviceCenter._id.toString() : req.user.serviceCenter.toString();
      const bkCenter = booking.serviceCenter ? (booking.serviceCenter._id ? booking.serviceCenter._id.toString() : booking.serviceCenter.toString()) : null;
      if (bkCenter !== mgrCenter) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access bookings for another service center',
        });
      }
    }

    // Authorization check for MECHANIC role
    if (req.user && req.user.role === 'MECHANIC') {
      const mechId = booking.mechanic
        ? booking.mechanic._id
          ? booking.mechanic._id.toString()
          : booking.mechanic.toString()
        : null;
      if (!mechId || mechId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this booking',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error in getBookingById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Create new booking (forces req.user._id for CUSTOMER role)
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { user: bodyUser, vehicle, service, serviceCenter, bookingDate, bookingTime, notes } =
      req.body;

    // Enforce owner ID based on authenticated user role
    let ownerId;
    if (req.user && req.user.role === 'CUSTOMER') {
      ownerId = req.user._id;
    } else {
      ownerId = bodyUser || (req.user ? req.user._id : null);
    }

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    if (!vehicle || !mongoose.Types.ObjectId.isValid(vehicle)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    if (!service || !mongoose.Types.ObjectId.isValid(service)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    if (!serviceCenter || !mongoose.Types.ObjectId.isValid(serviceCenter)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service center ID',
      });
    }

    // Status check: User must exist
    const userDoc = await User.findById(ownerId);
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Vehicle Ownership & Verification check
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }
    if (vehicleDoc.user.toString() !== ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle does not belong to this user',
      });
    }

    // Verification check: Service must exist
    const serviceDoc = await Service.findById(service);
    if (!serviceDoc) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Verification check: Service Center must exist
    const serviceCenterDoc = await ServiceCenter.findById(serviceCenter);
    if (!serviceCenterDoc) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found',
      });
    }

    // Status check: Service must be active
    if (!serviceDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is not available',
      });
    }

    // Service compatibility check: ServiceCenter must offer the requested Service
    if (
      serviceCenterDoc.services &&
      Array.isArray(serviceCenterDoc.services) &&
      serviceCenterDoc.services.length > 0
    ) {
      const serviceIds = serviceCenterDoc.services.map((s) => (s._id ? s._id.toString() : s.toString()));
      if (!serviceIds.includes(service.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Selected service center does not offer the requested service',
        });
      }
    }

    // Status check: ServiceCenter must be active
    if (!serviceCenterDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected service center is not available',
      });
    }

    // Service Availability at ServiceCenter check
    const isServiceOffered = serviceCenterDoc.services.some(
      (sId) => sId.toString() === service.toString()
    );
    if (!isServiceOffered) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is not available at this service center',
      });
    }

    // Date validation
    if (!bookingDate) {
      return res.status(400).json({
        success: false,
        message: 'Booking date is required',
      });
    }
    if (isPastDate(bookingDate)) {
      return res.status(400).json({
        success: false,
        message: 'Booking date cannot be in the past',
      });
    }

    // Time validation
    if (!bookingTime || typeof bookingTime !== 'string' || bookingTime.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Booking time is required',
      });
    }

    const slotRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    if (!slotRegex.test(bookingTime.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot format. Please select a valid slot (e.g. 10:30 AM).',
      });
    }

    // Double booking conflict check
    const targetDate = new Date(bookingDate);
    targetDate.setHours(0, 0, 0, 0);

    const existingConflict = await Booking.findOne({
      serviceCenter,
      bookingDate: targetDate,
      bookingTime: bookingTime.trim(),
      status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked',
      });
    }

    // Calculate amount using Service price
    const finalAmount = serviceDoc.price;

    const newBooking = await Booking.create({
      user: ownerId,
      vehicle,
      service,
      serviceCenter,
      bookingDate: targetDate,
      bookingTime: bookingTime.trim(),
      status: 'PENDING',
      amount: finalAmount,
      notes: notes ? notes.trim() : null,
    });

    const populatedBooking = await populateBooking(Booking.findById(newBooking._id));

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in createBooking:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const { bookingDate, bookingTime, notes, status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this booking',
        });
      }
    }

    // Ownership check for SERVICE_MANAGER role
    if (req.user && req.user.role === 'SERVICE_MANAGER' && req.user.serviceCenter) {
      const mgrCenter = req.user.serviceCenter._id ? req.user.serviceCenter._id.toString() : req.user.serviceCenter.toString();
      const bkCenter = booking.serviceCenter ? (booking.serviceCenter._id ? booking.serviceCenter._id.toString() : booking.serviceCenter.toString()) : null;
      if (bkCenter !== mgrCenter) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update bookings for another service center',
        });
      }
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot update booking that is ${booking.status.toLowerCase()}`,
      });
    }

    const updateData = {};

    // Validate date & slot conflict if date/time changing
    if (bookingDate !== undefined || bookingTime !== undefined) {
      const newDateVal = bookingDate !== undefined ? bookingDate : booking.bookingDate;
      const newTimeVal = bookingTime !== undefined ? bookingTime.trim() : booking.bookingTime;

      if (bookingDate !== undefined && isPastDate(bookingDate)) {
        return res.status(400).json({
          success: false,
          message: 'Booking date cannot be in the past',
        });
      }

      const targetDate = new Date(newDateVal);
      targetDate.setHours(0, 0, 0, 0);

      const conflict = await Booking.findOne({
        _id: { $ne: id },
        serviceCenter: booking.serviceCenter,
        bookingDate: targetDate,
        bookingTime: newTimeVal,
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked',
        });
      }

      updateData.bookingDate = targetDate;
      updateData.bookingTime = newTimeVal;
    }

    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    const updatedBooking = await populateBooking(
      Booking.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    );

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in updateBooking:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Cancel booking (enforces CUSTOMER ownership)
// @route   PATCH /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      const bookingUserId = booking.user?._id ? booking.user._id.toString() : booking.user?.toString();
      if (bookingUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking',
        });
      }
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Completed booking cannot be cancelled',
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: populatedBooking,
    });
  } catch (error) {
    console.error('Error in cancelBooking:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Assign mechanic to booking (Admin / Service Manager only)
// @route   PATCH /api/bookings/:id/assign-mechanic
export const assignMechanic = async (req, res) => {
  try {
    const { id } = req.params;
    const { mechanic } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    if (!mechanic || !mongoose.Types.ObjectId.isValid(mechanic)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mechanic ID',
      });
    }

    // Verify mechanic User exists and has role MECHANIC and is active
    const mechanicUser = await User.findById(mechanic);
    if (!mechanicUser || mechanicUser.role !== 'MECHANIC') {
      return res.status(400).json({
        success: false,
        message: 'User is not a valid mechanic',
      });
    }

    if (mechanicUser.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Assigned mechanic account is inactive',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership check for SERVICE_MANAGER role
    if (req.user && req.user.role === 'SERVICE_MANAGER' && req.user.serviceCenter) {
      const mgrCenter = req.user.serviceCenter._id ? req.user.serviceCenter._id.toString() : req.user.serviceCenter.toString();
      const bkCenter = booking.serviceCenter ? (booking.serviceCenter._id ? booking.serviceCenter._id.toString() : booking.serviceCenter.toString()) : null;
      if (bkCenter !== mgrCenter) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify bookings for another service center',
        });
      }
    }

    booking.mechanic = mechanic;

    // Auto-advance PENDING booking to CONFIRMED on mechanic assignment
    if (booking.status === 'PENDING') {
      booking.status = 'CONFIRMED';
    }

    await booking.save();

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      success: true,
      message: 'Mechanic assigned successfully',
      data: populatedBooking,
    });
  } catch (error) {
    console.error('Error in assignMechanic:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update booking status (Admin / Service Manager / Assigned Mechanic)
// @route   PATCH /api/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const allowedStatuses = [
      'PENDING',
      'CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'RESCHEDULED',
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Role permission check for MECHANIC
    if (req.user && req.user.role === 'MECHANIC') {
      const bkMechId = booking.mechanic
        ? booking.mechanic._id
          ? booking.mechanic._id.toString()
          : booking.mechanic.toString()
        : null;
      if (!bkMechId || bkMechId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update status for this booking',
        });
      }
    }

    // Ownership check for SERVICE_MANAGER role
    if (req.user && req.user.role === 'SERVICE_MANAGER' && req.user.serviceCenter) {
      const mgrCenter = req.user.serviceCenter._id ? req.user.serviceCenter._id.toString() : req.user.serviceCenter.toString();
      const bkCenter = booking.serviceCenter ? (booking.serviceCenter._id ? booking.serviceCenter._id.toString() : booking.serviceCenter.toString()) : null;
      if (bkCenter !== mgrCenter) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update bookings for another service center',
        });
      }
    }

    const currentStatus = booking.status;

    // Enforce strict status lifecycle transition rules
    if (currentStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled booking status cannot be changed',
      });
    }

    if (currentStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Completed booking status cannot be changed',
      });
    }

    if (currentStatus !== status) {
      const validTransitions = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        RESCHEDULED: ['CONFIRMED', 'IN_PROGRESS', 'CANCELLED'],
      };

      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${status}`,
        });
      }
    }

    booking.status = status;
    await booking.save();

    // Auto Invoice Generation on status === 'COMPLETED'
    if (status === 'COMPLETED') {
      const existingInvoice = await Invoice.findOne({ booking: booking._id });
      if (!existingInvoice) {
        let srvPrice = booking.amount || 0;
        let srvName = 'Car Repair Service';

        const srvId = booking.service?._id ? booking.service._id : booking.service;
        if (srvId) {
          const srvDoc = await Service.findById(srvId);
          if (srvDoc) {
            srvPrice = srvDoc.price;
            srvName = srvDoc.name;
          }
        }

        const year = new Date().getFullYear();
        let invoiceNumber = `CARFIX-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
        let conflict = await Invoice.findOne({ invoiceNumber });
        while (conflict) {
          invoiceNumber = `CARFIX-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
          conflict = await Invoice.findOne({ invoiceNumber });
        }

        const userId = booking.user?._id ? booking.user._id : booking.user;
        const vehicleId = booking.vehicle?._id ? booking.vehicle._id : booking.vehicle;

        await Invoice.create({
          invoiceNumber,
          booking: booking._id,
          user: userId,
          vehicle: vehicleId,
          items: [{ serviceName: srvName, quantity: 1, price: srvPrice, amount: srvPrice }],
          subtotal: srvPrice,
          tax: 0,
          total: srvPrice,
          paymentStatus: 'PENDING',
          paymentMethod: 'CASH',
          issuedAt: new Date(),
        });
      }
    }

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: populatedBooking,
    });
  } catch (error) {
    console.error('Error in updateBookingStatus:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
