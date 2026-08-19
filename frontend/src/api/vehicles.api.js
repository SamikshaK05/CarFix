import apiClient from './client.js';

// @desc    Get all vehicles for authenticated customer
// @endpoint GET /api/vehicles
export const getVehicles = async () => {
  return apiClient.get('/vehicles');
};

// @desc    Get single vehicle by ID
// @endpoint GET /api/vehicles/:id
export const getVehicleById = async (id) => {
  return apiClient.get(`/vehicles/${id}`);
};

// @desc    Create a new vehicle
// @endpoint POST /api/vehicles
export const createVehicle = async (vehicleData) => {
  return apiClient.post('/vehicles', vehicleData);
};

// @desc    Update an existing vehicle
// @endpoint PUT /api/vehicles/:id
export const updateVehicle = async (id, vehicleData) => {
  return apiClient.put(`/vehicles/${id}`, vehicleData);
};

// @desc    Delete a vehicle
// @endpoint DELETE /api/vehicles/:id
export const deleteVehicle = async (id) => {
  return apiClient.delete(`/vehicles/${id}`);
};
