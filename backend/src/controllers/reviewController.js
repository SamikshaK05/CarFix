import mongoose from 'mongoose';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import ServiceCenter from '../models/ServiceCenter.js';

// Helper function to populate review references
const populateReview = (query) => {
  return query
    .populate('user', 'name email avatar')
    .populate('serviceCenter', 'name city phone')
    .populate('booking', 'bookingDate bookingTime status');
};

// Helper function to recalculate ServiceCenter rating and totalReviews
const updateServiceCenterRating = async (serviceCenterId) => {
  if (!serviceCenterId) return;

  const reviews = await Review.find({ serviceCenter: serviceCenterId });
  const totalReviews = reviews.length;

  let averageRating = 0;
  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    averageRating = Math.round((sum / totalReviews) * 10) / 10;
  }

  await ServiceCenter.findByIdAndUpdate(serviceCenterId, {
    rating: averageRating,
    totalReviews: totalReviews,
  });
};

// @desc    Get all reviews (supports ?user=, ?serviceCenter=, ?booking=)
// @route   GET /api/reviews
export const getReviews = async (req, res) => {
  try {
    const { user, serviceCenter, booking } = req.query;
    const filter = {};

    if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
      }
      filter.user = user;
    }

    if (serviceCenter) {
      if (!mongoose.Types.ObjectId.isValid(serviceCenter)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid service center ID',
        });
      }
      filter.serviceCenter = serviceCenter;
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

    const reviews = await populateReview(Review.find(filter).sort({ createdAt: -1 }));

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('Error in getReviews:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get review by ID
// @route   GET /api/reviews/:id
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await populateReview(Review.findById(id));

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error in getReviewById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Create new review for completed booking (forces req.user._id for CUSTOMER role)
// @route   POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { user: bodyUser, booking, rating, comment } = req.body;

    let targetUser;
    if (req.user && req.user.role === 'CUSTOMER') {
      targetUser = req.user._id;
    } else {
      targetUser = bodyUser || (req.user ? req.user._id : null);
    }

    // Validate User ObjectId & existence
    if (!targetUser || !mongoose.Types.ObjectId.isValid(targetUser)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }
    const userDoc = await User.findById(targetUser);
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate Booking ObjectId & existence
    if (!booking || !mongoose.Types.ObjectId.isValid(booking)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }
    const bookingDoc = await Booking.findById(booking);
    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Validate Booking Ownership
    if (bookingDoc.user.toString() !== targetUser.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Review user does not own this booking',
      });
    }

    // Validate Booking Status
    if (bookingDoc.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Review can only be submitted for completed bookings',
      });
    }

    // Validate Rating (must be numeric between 1 and 5)
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Validate Duplicate Review
    const existingReview = await Review.findOne({ booking });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'A review already exists for this booking',
      });
    }

    // Derive serviceCenter from booking
    const serviceCenter = bookingDoc.serviceCenter;

    const newReview = await Review.create({
      user: targetUser,
      booking,
      serviceCenter,
      rating: numRating,
      comment: comment ? comment.trim() : null,
    });

    // Recalculate Service Center rating & totalReviews
    await updateServiceCenterRating(serviceCenter);

    const populatedReview = await populateReview(Review.findById(newReview._id));

    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A review already exists for this booking',
      });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in createReview:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update review (enforces CUSTOMER ownership)
// @route   PUT /api/reviews/:id
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this review',
        });
      }
    }

    const { rating, comment } = req.body;

    const updateData = {};

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
      updateData.rating = numRating;
    }

    if (comment !== undefined) {
      updateData.comment = comment ? comment.trim() : null;
    }

    const updatedReview = await populateReview(
      Review.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    );

    // Recalculate Service Center rating & totalReviews
    await updateServiceCenterRating(review.serviceCenter);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in updateReview:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Delete review (enforces CUSTOMER ownership)
// @route   DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this review',
        });
      }
    }

    await Review.findByIdAndDelete(id);

    // Recalculate Service Center rating & totalReviews after deletion
    await updateServiceCenterRating(review.serviceCenter);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteReview:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
