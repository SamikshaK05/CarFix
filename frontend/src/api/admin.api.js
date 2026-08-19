import apiClient from './client.js';

/**
 * @desc    Get admin dashboard data (statistics, recent users, bookings, invoices, reviews)
 * @access  Private / ADMIN only
 * @endpoint GET /api/admin/dashboard
 * @returns {Promise<Object>} API response object { success: true, data: { stats, recentUsers, ... } }
 */
export const getAdminDashboard = async () => {
  return apiClient.get('/admin/dashboard');
};