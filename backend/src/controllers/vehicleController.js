import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

// @desc    Get all vehicles (supports filtering by ?user=<USER_ID>, enforces CUSTOMER ownership)
// @route   GET /api/vehicles
export const getVehicles = async (req, res) => {
  try {
    const { user } = req.query;
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

    const vehicles = await Vehicle.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error('Error in getVehicles:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get vehicle by ID (enforces CUSTOMER ownership)
// @route   GET /api/vehicles/:id
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    const vehicle = await Vehicle.findById(id).populate('user', 'name email phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      const vehicleUserId = vehicle.user?._id ? vehicle.user._id.toString() : vehicle.user?.toString();
      if (vehicleUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this vehicle',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error('Error in getVehicleById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Create new vehicle (forces req.user._id for CUSTOMER role)
// @route   POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    const { user: bodyUser, make, model, year, registrationNumber, fuelType, color, mileage } = req.body;

    // Enforce owner ID based on authenticated user role
    let ownerId;
    if (req.user && req.user.role === 'CUSTOMER') {
      ownerId = req.user._id;
    } else {
      ownerId = bodyUser || (req.user ? req.user._id : null);
    }

    // Validate user ObjectId
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Check if User exists
    const userExists = await User.findById(ownerId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Basic required field checks
    if (!make || make.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Make is required',
      });
    }
    if (!model || model.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Model is required',
      });
    }
    const yearNum = Number(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle year',
      });
    }

    if (!registrationNumber || typeof registrationNumber !== 'string' || registrationNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required',
      });
    }

    const allowedFuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'EV'];
    if (!fuelType || !allowedFuelTypes.includes(fuelType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fuel type',
      });
    }

    const normalizedFuelType = fuelType === 'EV' ? 'Electric' : fuelType;

    // Duplicate registration number pre-check
    const formattedRegNum = registrationNumber.trim().toUpperCase();
    const existingVehicle = await Vehicle.findOne({ registrationNumber: formattedRegNum });
    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this registration number already exists',
      });
    }

    const newVehicle = await Vehicle.create({
      user: ownerId,
      make: make.trim(),
      model: model.trim(),
      year: yearNum,
      registrationNumber: formattedRegNum,
      fuelType: normalizedFuelType,
      color: color ? color.trim() : null,
      mileage: mileage !== undefined ? Number(mileage) : 0,
    });

    const populatedVehicle = await Vehicle.findById(newVehicle._id).populate(
      'user',
      'name email phone'
    );

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: populatedVehicle,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this registration number already exists',
      });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in createVehicle:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update vehicle (enforces CUSTOMER ownership)
// @route   PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      const vehicleUserId = vehicle.user?._id ? vehicle.user._id.toString() : vehicle.user?.toString();
      if (vehicleUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this vehicle',
        });
      }
    }

    const { make, model, year, registrationNumber, fuelType, color, mileage } = req.body;

    const updateData = {};
    if (make !== undefined) updateData.make = make.trim();
    if (model !== undefined) updateData.model = model.trim();
    if (year !== undefined) {
      const yearNum = Number(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle year',
        });
      }
      updateData.year = yearNum;
    }
    if (registrationNumber !== undefined) {
      if (typeof registrationNumber !== 'string' || registrationNumber.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Registration number cannot be empty',
        });
      }
      const formattedRegNum = registrationNumber.trim().toUpperCase();
      const existingVehicle = await Vehicle.findOne({
        registrationNumber: formattedRegNum,
        _id: { $ne: id },
      });
      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle with this registration number already exists',
        });
      }
      updateData.registrationNumber = formattedRegNum;
    }
    if (fuelType !== undefined) {
      const allowedFuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'EV'];
      if (!allowedFuelTypes.includes(fuelType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid fuel type',
        });
      }
      updateData.fuelType = fuelType === 'EV' ? 'Electric' : fuelType;
    }
    if (color !== undefined) updateData.color = color ? color.trim() : null;
    if (mileage !== undefined) updateData.mileage = Number(mileage);

    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('user', 'name email phone');

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this registration number already exists',
      });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in updateVehicle:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Delete vehicle (enforces CUSTOMER ownership)
// @route   DELETE /api/vehicles/:id
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Ownership check for CUSTOMER role
    if (req.user && req.user.role === 'CUSTOMER') {
      const vehicleUserId = vehicle.user?._id ? vehicle.user._id.toString() : vehicle.user?.toString();
      if (vehicleUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this vehicle',
        });
      }
    }

    // Active booking check before deletion
    const activeBooking = await Booking.findOne({
      vehicle: id,
      status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
    });
    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle associated with active bookings',
      });
    }

    await Vehicle.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteVehicle:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
