import apiClient from './client.js';

// @desc    Get all services (supports optional includeInactive query parameter for Admin)
// @endpoint GET /api/services
export const getServices = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.includeInactive !== undefined) {
    queryParams.append('includeInactive', String(params.includeInactive));
  }
  const queryString = queryParams.toString();
  return apiClient.get(`/services${queryString ? `?${queryString}` : ''}`);
};

// @desc    Get single service by ID
// @endpoint GET /api/services/:id
export const getServiceById = async (id) => {
  return apiClient.get(`/services/${id}`);
};

// @desc    Create a new service (Admin only)
// @endpoint POST /api/services
export const createService = async (serviceData) => {
  return apiClient.post('/services', serviceData);
};

// @desc    Update an existing service (Admin only)
// @endpoint PUT /api/services/:id
export const updateService = async (id, serviceData) => {
  return apiClient.put(`/services/${id}`, serviceData);
};

// @desc    Delete (soft-delete/deactivate) service (Admin only)
// @endpoint DELETE /api/services/:id
export const deleteService = async (id) => {
  return apiClient.delete(`/services/${id}`);
};
