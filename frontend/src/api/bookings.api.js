import apiClient from './client.js';

// @desc    Get all bookings (supports optional status/serviceCenter query params)
// @endpoint GET /api/bookings
export const getBookings = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status && params.status.trim() !== '') {
    queryParams.append('status', params.status.trim());
  }
  if (params.serviceCenter && params.serviceCenter.trim() !== '') {
    queryParams.append('serviceCenter', params.serviceCenter.trim());
  }
  const queryString = queryParams.toString();
  return apiClient.get(`/bookings${queryString ? `?${queryString}` : ''}`);
};

// @desc    Get completed service history for authenticated customer
// @endpoint GET /api/bookings/history
export const getServiceHistory = async () => {
  return apiClient.get('/bookings/history');
};

// @desc    Get single booking by ID
// @endpoint GET /api/bookings/:id
export const getBookingById = async (id) => {
  return apiClient.get(`/bookings/${id}`);
};

// @desc    Create a new booking
// @endpoint POST /api/bookings
export const createBooking = async (bookingData) => {
  return apiClient.post('/bookings', bookingData);
};

// @desc    Update an existing booking
// @endpoint PUT /api/bookings/:id
export const updateBooking = async (id, bookingData) => {
  return apiClient.put(`/bookings/${id}`, bookingData);
};

// @desc    Cancel a booking
// @endpoint PATCH /api/bookings/:id/cancel
export const cancelBooking = async (id) => {
  return apiClient.patch(`/bookings/${id}/cancel`);
};

// @desc    Assign mechanic to booking (Admin / Service Manager only)
// @endpoint PATCH /api/bookings/:id/assign-mechanic
export const assignMechanic = async (id, mechanicId) => {
  return apiClient.patch(`/bookings/${id}/assign-mechanic`, { mechanic: mechanicId });
};

// @desc    Update booking status (Admin / Service Manager / Mechanic)
// @endpoint PATCH /api/bookings/:id/status
export const updateBookingStatus = async (id, status) => {
  return apiClient.patch(`/bookings/${id}/status`, { status });
};
