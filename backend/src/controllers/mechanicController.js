import Booking from '../models/Booking.js';

// @desc    Get mechanic dashboard data (profile, job stats, today schedule, active jobs, completed jobs)
// @route   GET /api/mechanic/dashboard
export const getMechanicDashboard = async (req, res) => {
  try {
    const mechanicId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Strictly filter jobs assigned to this mechanic
    const mechanicFilter = { mechanic: mechanicId };

    // Parallel database queries for performance
    const [
      totalJobs,
      inProgressJobs,
      confirmedJobs,
      pendingJobs,
      completedJobs,
      todayJobs,
      todaySchedule,
      activeJobs,
      recentCompletedJobs,
    ] = await Promise.all([
      Booking.countDocuments(mechanicFilter),
      Booking.countDocuments({ ...mechanicFilter, status: 'IN_PROGRESS' }),
      Booking.countDocuments({ ...mechanicFilter, status: 'CONFIRMED' }),
      Booking.countDocuments({ ...mechanicFilter, status: 'PENDING' }),
      Booking.countDocuments({ ...mechanicFilter, status: 'COMPLETED' }),
      Booking.countDocuments({
        ...mechanicFilter,
        bookingDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      }),

      Booking.find({
        ...mechanicFilter,
        bookingDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      })
        .sort({ bookingTime: 1 })
        .populate('user', 'name email phone')
        .populate('vehicle', 'make model registrationNumber')
        .populate('service', 'name price category duration')
        .populate('serviceCenter', 'name city address phone')
        .populate('mechanic', 'name email phone avatar')
        .lean(),

      Booking.find({
        ...mechanicFilter,
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        bookingDate: { $gte: today },
      })
        .sort({ bookingDate: 1, bookingTime: 1 })
        .limit(5)
        .populate('user', 'name email phone')
        .populate('vehicle', 'make model registrationNumber')
        .populate('service', 'name price category duration')
        .populate('serviceCenter', 'name city address phone')
        .populate('mechanic', 'name email phone avatar')
        .lean(),

      Booking.find({ ...mechanicFilter, status: 'COMPLETED' })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('user', 'name email phone')
        .populate('vehicle', 'make model registrationNumber')
        .populate('service', 'name price category duration')
        .populate('serviceCenter', 'name city address phone')
        .populate('mechanic', 'name email phone avatar')
        .lean(),
    ]);

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
          totalJobs,
          inProgressJobs,
          confirmedJobs,
          pendingJobs,
          completedJobs,
          todayJobs,
        },
        todaySchedule,
        activeJobs,
        recentCompletedJobs,
      },
    });
  } catch (error) {
    console.error('Error in getMechanicDashboard:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
