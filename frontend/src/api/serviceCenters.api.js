import apiClient from './client.js';

// @desc    Get all service centers (supports optional city & includeInactive query parameters)
// @endpoint GET /api/service-centers
export const getServiceCenters = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.city && params.city.trim() !== '') {
    queryParams.append('city', params.city.trim());
  }
  if (params.includeInactive !== undefined) {
    queryParams.append('includeInactive', String(params.includeInactive));
  }
  const queryString = queryParams.toString();
  return apiClient.get(`/service-centers${queryString ? `?${queryString}` : ''}`);
};

// @desc    Get single service center by ID
// @endpoint GET /api/service-centers/:id
export const getServiceCenterById = async (id) => {
  return apiClient.get(`/service-centers/${id}`);
};

// @desc    Create a new service center (Admin / Service Manager)
// @endpoint POST /api/service-centers
export const createServiceCenter = async (centerData) => {
  return apiClient.post('/service-centers', centerData);
};

// @desc    Update an existing service center (Admin / Service Manager)
// @endpoint PUT /api/service-centers/:id
export const updateServiceCenter = async (id, centerData) => {
  return apiClient.put(`/service-centers/${id}`, centerData);
};

// @desc    Delete (soft-delete/deactivate) service center (Admin / Service Manager)
// @endpoint DELETE /api/service-centers/:id
export const deleteServiceCenter = async (id) => {
  return apiClient.delete(`/service-centers/${id}`);
};
