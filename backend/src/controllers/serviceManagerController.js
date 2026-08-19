import ServiceCenter from '../models/ServiceCenter.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Review from '../models/Review.js';

// @desc    Get service manager dashboard data
// @route   GET /api/service-manager/dashboard
export const getServiceManagerDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Concurrent database queries for optimal performance
    const [
      totalServiceCenters,
      activeServiceCenters,
      totalServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      upcomingBookingsCount,
      totalInvoices,
      paidInvoices,
      pendingPayments,
      totalReviews,
      serviceCenters,
      upcomingBookings,
      recentBookings,
      recentInvoices,
      recentReviews,
    ] = await Promise.all([
      ServiceCenter.countDocuments(),
      ServiceCenter.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'PENDING' }),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.countDocuments({ status: 'IN_PROGRESS' }),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
      Booking.countDocuments({
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        bookingDate: { $gte: today },
      }),
      Invoice.countDocuments(),
      Invoice.countDocuments({ paymentStatus: 'PAID' }),
      Invoice.countDocuments({ paymentStatus: 'PENDING' }),
      Review.countDocuments(),

      ServiceCenter.find()
        .select('name address city state pincode phone email openingHours rating totalReviews isActive')
        .sort({ createdAt: -1 })
        .lean(),

      Booking.find({
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        bookingDate: { $gte: today },
      })
        .sort({ bookingDate: 1, bookingTime: 1 })
        .limit(5)
        .populate('user', 'name email phone')
        .populate('vehicle', 'make model registrationNumber')
        .populate('service', 'name price category')
        .populate('serviceCenter', 'name city address phone')
        .lean(),

      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email phone')
        .populate('vehicle', 'make model registrationNumber')
        .populate('service', 'name price category')
        .populate('serviceCenter', 'name city address phone')
        .lean(),

      Invoice.find()
        .sort({ issuedAt: -1 })
        .limit(5)
        .select('invoiceNumber subtotal tax total paymentStatus paymentMethod issuedAt booking user vehicle')
        .populate('user', 'name email phone')
        .populate('vehicle', 'make model registrationNumber')
        .populate('booking', 'bookingDate bookingTime status')
        .lean(),

      Review.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email avatar')
        .populate('serviceCenter', 'name city')
        .populate('booking', 'bookingDate status')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalServiceCenters,
          activeServiceCenters,
          totalServices,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          inProgressBookings,
          completedBookings,
          cancelledBookings,
          upcomingBookings: upcomingBookingsCount,
          totalInvoices,
          paidInvoices,
          pendingPayments,
          totalReviews,
        },
        serviceCenters,
        upcomingBookings,
        recentBookings,
        recentInvoices,
        recentReviews,
      },
    });
  } catch (error) {
    console.error('Error in getServiceManagerDashboard:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
