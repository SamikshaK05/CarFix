import apiClient from './client.js';

/**
 * @desc    Get mechanic dashboard data (profile, job stats, today schedule, active jobs, completed jobs)
 * @access  Private / MECHANIC only
 * @endpoint GET /api/mechanic/dashboard
 * @returns {Promise<Object>} API response containing dashboard data
 */
export const getMechanicDashboard = async () => {
  return apiClient.get('/mechanic/dashboard');
};
