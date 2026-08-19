import apiClient from './client.js';

/**
 * @desc    Get Service Manager Dashboard stats, overview metrics & activity feeds
 * @access  Private / SERVICE_MANAGER only
 * @endpoint GET /api/service-manager/dashboard
 * @returns {Promise<Object>} API response with dashboard statistics
 */
export const getServiceManagerDashboard = async () => {
  return apiClient.get('/service-manager/dashboard');
};
