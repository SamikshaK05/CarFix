import apiClient from './client.js';

// @desc    Get customer dashboard data (user, stats, vehicles, upcomingBookings, recentBookings, etc.)
// @endpoint GET /api/customer/dashboard
export const getCustomerDashboard = async () => {
  return apiClient.get('/customer/dashboard');
};
