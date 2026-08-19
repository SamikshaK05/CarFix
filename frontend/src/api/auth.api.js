import apiClient from './client.js';

// @desc    Register a new user
// @endpoint POST /api/auth/register
export const registerUser = async (userData) => {
  return apiClient.post('/auth/register', userData);
};

// @desc    Authenticate user & get token
// @endpoint POST /api/auth/login
export const loginUser = async (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

// @desc    Get authenticated user profile
// @endpoint GET /api/auth/me
export const getCurrentUser = async () => {
  return apiClient.get('/auth/me');
};

// @desc    Update authenticated user profile
// @endpoint PUT /api/auth/profile
export const updateProfile = async (userData) => {
  return apiClient.put('/auth/profile', userData);
};

// @desc    Request password reset email
// @endpoint POST /api/auth/forgot-password
export const forgotPassword = async (email) => {
  return apiClient.post('/auth/forgot-password', { email });
};

// @desc    Reset password using token
// @endpoint POST /api/auth/reset-password
export const resetPassword = async (token, password) => {
  return apiClient.post('/auth/reset-password', { token, password });
};

// @desc    Change password for logged-in user
// @endpoint PUT /api/auth/change-password
export const changePassword = async (currentPassword, newPassword) => {
  return apiClient.put('/auth/change-password', { currentPassword, newPassword });
};
