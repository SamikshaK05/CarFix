import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Review from '../models/Review.js';

// @desc    Get customer dashboard data (metrics, recent bookings, recent invoices, activity feed)
// @route   GET /api/customer/dashboard OR GET /api/dashboard/customer
export const getCustomerDashboard = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    // Identify customer strictly from req.user._id (ignore any req.query.user override)
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parallel database queries for metric calculations
    const [
      vehicles,
      totalVehicles,
      totalBookings,
      activeBookingsCount,
      pendingBookingsCount,
      upcomingBookingsCount,
      completedServicesCount,
      cancelledBookingsCount,
      upcomingBookings,
      recentBookings,
      totalInvoicesCount,
      pendingInvoicesCount,
      recentInvoices,
      totalReviewsCount,
      recentReviews,
    ] = await Promise.all([
      Vehicle.find({ user: userId })
        .select('make model year registrationNumber fuelType color mileage')
        .sort({ createdAt: -1 })
        .lean(),

      Vehicle.countDocuments({ user: userId }),

      Booking.countDocuments({ user: userId }),

      Booking.countDocuments({
        user: userId,
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'] },
      }),

      Booking.countDocuments({ user: userId, status: 'PENDING' }),

      Booking.countDocuments({
        user: userId,
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        bookingDate: { $gte: today },
      }),

      Booking.countDocuments({ user: userId, status: 'COMPLETED' }),

      Booking.countDocuments({ user: userId, status: 'CANCELLED' }),

      Booking.find({
        user: userId,
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        bookingDate: { $gte: today },
      })
        .sort({ bookingDate: 1, bookingTime: 1 })
        .limit(5)
        .populate('service', 'name price category')
        .populate('serviceCenter', 'name city phone address')
        .populate('vehicle', 'make model registrationNumber')
        .lean(),

      Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('service', 'name price category')
        .populate('serviceCenter', 'name city phone address')
        .populate('vehicle', 'make model registrationNumber')
        .lean(),

      Invoice.countDocuments({ user: userId }),

      Invoice.countDocuments({ user: userId, paymentStatus: 'PENDING' }),

      Invoice.find({ user: userId })
        .sort({ issuedAt: -1 })
        .limit(10)
        .select('invoiceNumber subtotal tax total paymentStatus paymentMethod issuedAt booking vehicle')
        .populate('vehicle', 'make model registrationNumber')
        .lean(),

      Review.countDocuments({ user: userId }),

      Review.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('serviceCenter', 'name city')
        .lean(),
    ]);

    // Construct unified Recent Activity feed from stored bookings and invoices
    const activityFeed = [];

    recentBookings.forEach((b) => {
      const vStr = b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : 'Vehicle';
      const sStr = b.service?.name || 'Service';
      const timestamp = b.updatedAt || b.createdAt || b.bookingDate;

      if (b.status === 'CANCELLED') {
        activityFeed.push({
          id: `act-b-${b._id}`,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          description: `Cancelled appointment for ${sStr} (${vStr})`,
          timestamp,
        });
      } else if (b.status === 'COMPLETED') {
        activityFeed.push({
          id: `act-b-${b._id}`,
          type: 'SERVICE_COMPLETED',
          title: 'Service Completed',
          description: `Completed ${sStr} for ${vStr}`,
          timestamp,
        });
      } else if (b.status === 'CONFIRMED') {
        activityFeed.push({
          id: `act-b-${b._id}`,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          description: `Confirmed ${sStr} appointment for ${vStr}`,
          timestamp,
        });
      } else {
        activityFeed.push({
          id: `act-b-${b._id}`,
          type: 'BOOKING_CREATED',
          title: 'New Service Scheduled',
          description: `Scheduled ${sStr} appointment for ${vStr}`,
          timestamp,
        });
      }
    });

    recentInvoices.forEach((inv) => {
      activityFeed.push({
        id: `act-i-${inv._id}`,
        type: 'INVOICE_GENERATED',
        title: `Invoice ${inv.paymentStatus === 'PAID' ? 'Paid' : 'Issued'}`,
        description: `Invoice #${inv.invoiceNumber} for ₹${inv.total} (${inv.paymentStatus})`,
        timestamp: inv.issuedAt || inv.createdAt,
      });
    });

    // Sort recent activity newest first
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = activityFeed.slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          avatar: req.user.avatar,
          role: req.user.role,
        },
        stats: {
          totalVehicles,
          totalBookings,
          activeBookings: activeBookingsCount,
          completedServices: completedServicesCount,
          completedBookings: completedServicesCount,
          pendingInvoices: pendingInvoicesCount,
          totalInvoices: totalInvoicesCount,
          upcomingBookings: upcomingBookingsCount,
          pendingBookings: pendingBookingsCount,
          cancelledBookings: cancelledBookingsCount,
          totalReviews: totalReviewsCount,
        },
        totalVehicles,
        activeBookings: activeBookingsCount,
        completedServices: completedServicesCount,
        pendingInvoices: pendingInvoicesCount,
        vehicles,
        upcomingBookings,
        recentBookings,
        recentInvoices,
        recentReviews,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error in getCustomerDashboard:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
