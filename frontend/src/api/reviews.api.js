import apiClient from './client.js';

// @desc    Get reviews (supports optional user, serviceCenter, booking query parameters)
// @endpoint GET /api/reviews
export const getReviews = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/reviews${query ? `?${query}` : ''}`);
};

// @desc    Get single review details by ID
// @endpoint GET /api/reviews/:id
export const getReviewById = async (id) => {
  return apiClient.get(`/reviews/${id}`);
};

// @desc    Create review for completed booking
// @endpoint POST /api/reviews
export const createReview = async (reviewData) => {
  return apiClient.post('/reviews', reviewData);
};

// @desc    Update an existing review (Admin / Customer owner)
// @endpoint PUT /api/reviews/:id
export const updateReview = async (id, reviewData) => {
  return apiClient.put(`/reviews/${id}`, reviewData);
};

// @desc    Delete review (Admin / Customer owner)
// @endpoint DELETE /api/reviews/:id
export const deleteReview = async (id) => {
  return apiClient.delete(`/reviews/${id}`);
};
