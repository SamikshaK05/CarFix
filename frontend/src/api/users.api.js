import apiClient from './client.js';

/**
 * @desc    Get all users for Admin User Management with filtering & pagination
 * @access  Private / ADMIN only
 * @endpoint GET /api/admin/users
 * @param   {Object} params - { search, role, isActive, page, limit }
 * @returns {Promise<Object>} API response with count, total, page, pages, and users list
 */
export const getAdminUsers = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.search && params.search.trim() !== '') {
    queryParams.append('search', params.search.trim());
  }

  if (params.role && params.role.trim() !== '') {
    queryParams.append('role', params.role.trim().toUpperCase());
  }

  if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '') {
    queryParams.append('isActive', String(params.isActive));
  }

  if (params.page) {
    queryParams.append('page', String(params.page));
  }

  if (params.limit) {
    queryParams.append('limit', String(params.limit));
  }

  const queryString = queryParams.toString();
  return apiClient.get(`/admin/users${queryString ? `?${queryString}` : ''}`);
};

/**
 * @desc    Get single user details by ID
 * @access  Private / ADMIN only
 * @endpoint GET /api/admin/users/:id
 * @param   {string} id - User ObjectId
 * @returns {Promise<Object>} API response with user details
 */
export const getAdminUserById = async (id) => {
  return apiClient.get(`/admin/users/${id}`);
};

/**
 * @desc    Update editable user information (name, email, phone, role, avatar)
 * @access  Private / ADMIN only
 * @endpoint PUT /api/admin/users/:id
 * @param   {string} id - User ObjectId
 * @param   {Object} userData - { name, email, phone, role, avatar }
 * @returns {Promise<Object>} API response with updated user details
 */
export const updateAdminUser = async (id, userData) => {
  return apiClient.put(`/admin/users/${id}`, userData);
};

/**
 * @desc    Activate or deactivate user account
 * @access  Private / ADMIN only
 * @endpoint PATCH /api/admin/users/:id/status
 * @param   {string} id - User ObjectId
 * @param   {boolean} isActive - true or false
 * @returns {Promise<Object>} API response with updated user status
 */
export const updateAdminUserStatus = async (id, isActive) => {
  return apiClient.patch(`/admin/users/${id}/status`, { isActive });
};

/**
 * @desc    Delete user account safely (checks dependencies & self-protection)
 * @access  Private / ADMIN only
 * @endpoint DELETE /api/admin/users/:id
 * @param   {string} id - User ObjectId
 * @returns {Promise<Object>} API response message
 */
export const deleteAdminUser = async (id) => {
  return apiClient.delete(`/admin/users/${id}`);
};
