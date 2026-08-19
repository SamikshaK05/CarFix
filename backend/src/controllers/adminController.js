import mongoose from 'mongoose';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Service from '../models/Service.js';
import ServiceCenter from '../models/ServiceCenter.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Review from '../models/Review.js';

// @desc    Get admin dashboard data (system stats, recent records, service centers)
// @route   GET /api/admin/dashboard
// @access  Private / ADMIN only
export const getAdminDashboard = async (req, res) => {
  try {
    // Parallel database queries for maximum performance
    const [
      totalUsers,
      totalCustomers,
      totalMechanics,
      totalServiceManagers,
      totalAdmins,

      totalVehicles,

      totalServices,
      activeServices,

      totalServiceCenters,
      activeServiceCenters,

      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,

      totalInvoices,
      pendingPayments,
      paidInvoices,

      totalReviews,

      recentUsers,
      recentBookings,
      recentInvoices,
      recentReviews,
      serviceCenters,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'MECHANIC' }),
      User.countDocuments({ role: 'SERVICE_MANAGER' }),
      User.countDocuments({ role: 'ADMIN' }),

      Vehicle.countDocuments(),

      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),

      ServiceCenter.countDocuments(),
      ServiceCenter.countDocuments({ isActive: true }),

      Booking.countDocuments(),
      Booking.countDocuments({ status: 'PENDING' }),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.countDocuments({ status: 'IN_PROGRESS' }),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),

      Invoice.countDocuments(),
      Invoice.countDocuments({ paymentStatus: 'PENDING' }),
      Invoice.countDocuments({ paymentStatus: 'PAID' }),

      Review.countDocuments(),

      User.find().select('-password').sort({ createdAt: -1 }).limit(5).lean(),

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

      ServiceCenter.find()
        .select('name city state phone rating totalReviews isActive')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCustomers,
          totalMechanics,
          totalServiceManagers,
          totalAdmins,
          totalVehicles,
          totalServices,
          activeServices,
          totalServiceCenters,
          activeServiceCenters,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          inProgressBookings,
          completedBookings,
          cancelledBookings,
          totalInvoices,
          pendingPayments,
          paidInvoices,
          totalReviews,
        },
        recentUsers,
        recentBookings,
        recentInvoices,
        recentReviews,
        serviceCenters,
      },
    });
  } catch (error) {
    console.error('Error in getAdminDashboard:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get all users with filtering, searching, and pagination
// @route   GET /api/admin/users
// @access  Private / ADMIN only
export const getAdminUsers = async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 10 } = req.query;
    const filter = {};

    // 1. Search filter (matches name, email, or phone)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    // 2. Role filter
    if (role && role.trim() !== '') {
      const allowedRoles = ['CUSTOMER', 'ADMIN', 'MECHANIC', 'SERVICE_MANAGER'];
      if (allowedRoles.includes(role.trim().toUpperCase())) {
        filter.role = role.trim().toUpperCase();
      }
    }

    // 3. Status filter
    if (isActive !== undefined && isActive !== '') {
      if (isActive === 'true' || isActive === true) {
        filter.isActive = true;
      } else if (isActive === 'false' || isActive === false) {
        filter.isActive = false;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      page: pageNum,
      pages: Math.ceil(totalUsers / limitNum) || 1,
      data: users,
    });
  } catch (error) {
    console.error('Error in getAdminUsers:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get user details by ID
// @route   GET /api/admin/users/:id
// @access  Private / ADMIN only
export const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await User.findById(id).select('-password').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error in getAdminUserById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update editable user information and role
// @route   PUT /api/admin/users/:id
// @access  Private / ADMIN only
export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, email, phone, role, avatar } = req.body;
    const allowedRoles = ['CUSTOMER', 'ADMIN', 'MECHANIC', 'SERVICE_MANAGER'];

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty',
        });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (!email || email.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Email cannot be empty',
        });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email address is already in use by another account',
          });
        }
        user.email = normalizedEmail;
      }
    }

    if (phone !== undefined) {
      user.phone = phone ? phone.trim() : '';
    }

    if (role !== undefined) {
      const upperRole = role.trim().toUpperCase();
      if (!allowedRoles.includes(upperRole)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`,
        });
      }
      user.role = upperRole;
    }

    if (avatar !== undefined) {
      user.avatar = avatar ? avatar.trim() : null;
    }

    await user.save();

    const updatedUser = await User.findById(id).select('-password').lean();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already in use by another account',
      });
    }
    console.error('Error in updateAdminUser:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Activate or deactivate user account (with self-protection)
// @route   PATCH /api/admin/users/:id/status
// @access  Private / ADMIN only
export const updateAdminUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Self-protection check
    if (req.user && req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Self-deactivation protection: Admins cannot deactivate their own account',
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive field must be a boolean (true or false)',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = isActive;
    await user.save();

    const updatedUser = await User.findById(id).select('-password').lean();

    return res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error in updateAdminUserStatus:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Delete user account safely (checks dependencies & self-protection)
// @route   DELETE /api/admin/users/:id
// @access  Private / ADMIN only
export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Self-protection check
    if (req.user && req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Self-deletion protection: Admins cannot delete their own account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check historical dependencies
    const [vehiclesCount, bookingsCount, invoicesCount, reviewsCount] = await Promise.all([
      Vehicle.countDocuments({ user: id }),
      Booking.countDocuments({ user: id }),
      Invoice.countDocuments({ user: id }),
      Review.countDocuments({ user: id }),
    ]);

    if (vehiclesCount > 0 || bookingsCount > 0 || invoicesCount > 0 || reviewsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with associated vehicles, bookings, invoices, or reviews. Please deactivate the account instead.',
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteAdminUser:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
