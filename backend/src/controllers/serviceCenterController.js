import mongoose from 'mongoose';
import ServiceCenter from '../models/ServiceCenter.js';

// @desc    Get all service centers (supports search, city, service filter & includeInactive)
// @route   GET /api/service-centers
export const getServiceCenters = async (req, res) => {
  try {
    const { city, search, name, service, includeInactive } = req.query;

    const filter = {};

    // Filter by active state unless includeInactive === 'true'
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    // Case-insensitive city filter if provided
    if (city && city.trim() !== '') {
      filter.city = { $regex: new RegExp(city.trim(), 'i') };
    }

    // Case-insensitive name filter if provided directly
    if (name && name.trim() !== '') {
      filter.name = { $regex: new RegExp(name.trim(), 'i') };
    }

    // Combined search term (matches name, address, city)
    if (search && search.trim() !== '') {
      const s = search.trim();
      const searchRegex = new RegExp(s, 'i');
      filter.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { address: searchRegex },
      ];
    }

    // Filter by service ID if provided
    if (service && service.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(service.trim())) {
        filter.services = service.trim();
      }
    }

    const serviceCenters = await ServiceCenter.find(filter)
      .populate('services')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: serviceCenters.length,
      data: serviceCenters,
    });
  } catch (error) {
    console.error('Error in getServiceCenters:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get service center by ID
// @route   GET /api/service-centers/:id
export const getServiceCenterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service center ID',
      });
    }

    const serviceCenter = await ServiceCenter.findById(id).populate('services');

    if (!serviceCenter) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: serviceCenter,
    });
  } catch (error) {
    console.error('Error in getServiceCenterById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Create new service center
// @route   POST /api/service-centers
export const createServiceCenter = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      openingHours,
      services,
      latitude,
      longitude,
      rating,
      totalReviews,
    } = req.body;

    // Basic required field checks
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Service center name is required',
      });
    }
    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Address is required',
      });
    }
    if (!city || city.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'City is required',
      });
    }
    if (!phone || phone.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Phone is required',
      });
    }

    // Validate services array ObjectIds if provided
    if (services && Array.isArray(services)) {
      for (const serviceId of services) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid service ID: ${serviceId}`,
          });
        }
      }
    }

    const newServiceCenter = await ServiceCenter.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      address: address.trim(),
      city: city.trim(),
      state: state ? state.trim() : null,
      pincode: pincode ? pincode.trim() : null,
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : null,
      openingHours: openingHours ? openingHours.trim() : null,
      services: services || [],
      latitude: latitude !== undefined ? latitude : null,
      longitude: longitude !== undefined ? longitude : null,
      rating: rating !== undefined ? rating : 0,
      totalReviews: totalReviews !== undefined ? totalReviews : 0,
      isActive: true,
    });

    const populatedCenter = await ServiceCenter.findById(newServiceCenter._id).populate('services');

    return res.status(201).json({
      success: true,
      message: 'Service center created successfully',
      data: populatedCenter,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in createServiceCenter:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update service center
// @route   PUT /api/service-centers/:id
export const updateServiceCenter = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service center ID',
      });
    }

    const {
      name,
      description,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      openingHours,
      services,
      latitude,
      longitude,
      isActive,
    } = req.body;

    // Validate services array if provided
    if (services && Array.isArray(services)) {
      for (const serviceId of services) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid service ID: ${serviceId}`,
          });
        }
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (openingHours !== undefined) updateData.openingHours = openingHours;
    if (services !== undefined) updateData.services = services;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCenter = await ServiceCenter.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('services');

    if (!updatedCenter) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service center updated successfully',
      data: updatedCenter,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Error in updateServiceCenter:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Delete service center (Soft delete)
// @route   DELETE /api/service-centers/:id
export const deleteServiceCenter = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service center ID',
      });
    }

    const serviceCenter = await ServiceCenter.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!serviceCenter) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service center deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteServiceCenter:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
