import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Search,
  Eye,
  Edit3,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  User,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Clock,
} from 'lucide-react';
import {
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../../api/reviews.api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [viewingReview, setViewingReview] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({ rating: 5, comment: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [confirmDeleteReview, setConfirmDeleteReview] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all platform reviews
  const fetchReviewsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReviews();
      if (res && res.success) {
        setReviews(res.data || []);
      } else {
        throw new Error(res?.message || 'Failed to fetch customer reviews');
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
      setError(err.data?.message || err.message || 'Unable to load customer reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  // Derive unique Service Center names for filter dropdown
  const uniqueCenters = Array.from(
    new Set(
      reviews
        .map((r) => (r.serviceCenter && typeof r.serviceCenter === 'object' ? r.serviceCenter.name : null))
        .filter(Boolean)
    )
  ).sort();

  // Client-side filtering
  const filteredReviews = reviews.filter((r) => {
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const custName = (r.user?.name || '').toLowerCase().includes(term);
      const custEmail = (r.user?.email || '').toLowerCase().includes(term);
      const scName = (r.serviceCenter?.name || '').toLowerCase().includes(term);
      const scCity = (r.serviceCenter?.city || '').toLowerCase().includes(term);
      const commentText = (r.comment || '').toLowerCase().includes(term);

      if (!custName && !custEmail && !scName && !scCity && !commentText) return false;
    }

    if (ratingFilter !== '') {
      if (r.rating !== parseInt(ratingFilter, 10)) return false;
    }

    if (centerFilter !== '') {
      const centerName = r.serviceCenter && typeof r.serviceCenter === 'object' ? r.serviceCenter.name : '';
      if (centerName !== centerFilter) return false;
    }

    return true;
  });

  const totalItems = filteredReviews.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedReviews = filteredReviews.slice((page - 1) * limit, page * limit);

  // Summary Metrics & Star Distribution Calculations
  const totalCount = reviews.length;
  const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const avgRatingVal = totalCount > 0 ? (ratingSum / totalCount).toFixed(1) : '0.0';

  const starCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  // View Details Modal Handler
  const handleOpenViewModal = async (reviewId) => {
    try {
      setViewLoading(true);
      setViewingReview(null);
      const res = await getReviewById(reviewId);
      if (res && res.success && res.data) {
        setViewingReview(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch review details');
      }
    } catch (err) {
      console.error('Error viewing review details:', err);
      alert(err.data?.message || err.message || 'Could not load review details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Edit Review Modal Open & Submit Handlers
  const handleOpenEditModal = (r) => {
    setEditingReview(r);
    setEditFormData({
      rating: r.rating || 5,
      comment: r.comment || '',
    });
    setEditError(null);
  };

  const handleUpdateReviewSubmit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    const rId = editingReview._id || editingReview.id;

    try {
      setEditLoading(true);
      setEditError(null);

      const payload = {
        rating: parseInt(editFormData.rating, 10),
        comment: editFormData.comment ? editFormData.comment.trim() : null,
      };

      const res = await updateReview(rId, payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: 'Review updated successfully and Service Center rating recalculated.' });
        setEditingReview(null);
        fetchReviewsData();
      } else {
        throw new Error(res?.message || 'Failed to update review');
      }
    } catch (err) {
      console.error('Error updating review:', err);
      setEditError(err.data?.message || err.message || 'Failed to update review.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Review Handler
  const handleDeleteReviewSubmit = async () => {
    if (!confirmDeleteReview) return;
    const rId = confirmDeleteReview._id || confirmDeleteReview.id;

    try {
      setDeleteLoading(true);
      const res = await deleteReview(rId);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: 'Review permanently deleted and Service Center rating recalculated.' });
        setConfirmDeleteReview(null);
        fetchReviewsData();
      } else {
        throw new Error(res?.message || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert(err.data?.message || err.message || 'Review deletion failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Visual Star Rendering Helper
  const renderStars = (ratingVal) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          fill={i <= ratingVal ? '#F59E0B' : 'transparent'}
          color={i <= ratingVal ? '#F59E0B' : '#CBD5E1'}
          style={{ marginRight: '2px' }}
        />
      );
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{stars}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Star size={28} color="var(--primary-accent)" fill="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Review Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Monitor and manage customer feedback across all service centers.
          </p>
        </div>

        <button
          type="button"
          className="btn-card-secondary"
          onClick={fetchReviewsData}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedbackMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: feedbackMsg.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* SEARCH & FILTER SECTION */}
      <div className="search-filter-card" style={{ padding: '1.25rem', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
        <div className="search-filter-grid">
          {/* SEARCH INPUT */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search customer, workshop, or review comments..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* RATING FILTER */}
          <select
            className="form-control"
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* SERVICE CENTER FILTER */}
          <select
            className="form-control"
            value={centerFilter}
            onChange={(e) => {
              setCenterFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Service Centers</option>
            {uniqueCenters.map((scName) => (
              <option key={scName} value={scName}>
                {scName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY METRICS & STAR DISTRIBUTION GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* STATS CARDS */}
        <div className="dashboard-stats-grid" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Reviews</span>
            <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{stats.totalCount}</strong>
          </div>
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Rating</span>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '1.4rem', color: '#F59E0B', marginTop: '0.2rem' }}>
              <Star size={20} fill="#F59E0B" /> {avgRatingVal} / 5
            </strong>
          </div>
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>5-Star Reviews</span>
            <strong style={{ display: 'block', fontSize: '1.4rem', color: '#10B981', marginTop: '0.2rem' }}>{starCounts[5]}</strong>
          </div>
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>1-Star Reviews</span>
            <strong style={{ display: 'block', fontSize: '1.4rem', color: '#EF4444', marginTop: '0.2rem' }}>{starCounts[1]}</strong>
          </div>
        </div>

        {/* STAR RATING DISTRIBUTION BREAKDOWN BAR */}
        <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem' }}>
            Rating Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = starCounts[stars];
              const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
                  <span style={{ width: '60px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {stars} <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  </span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: stars >= 4 ? '#10B981' : stars === 3 ? '#F59E0B' : '#EF4444',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ width: '80px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* REVIEWS TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading customer reviews...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Reviews</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchReviewsData}>
            Try Again
          </button>
        </div>
      ) : paginatedReviews.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <MessageSquare size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
            {search || ratingFilter || centerFilter ? 'No Reviews Match Your Filters' : 'No Reviews Found'}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || ratingFilter || centerFilter ? 'Try clearing or adjusting your search parameters.' : 'There are currently no reviews submitted by customers.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-responsive-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service Center</th>
                  <th>Rating</th>
                  <th>Review Comment</th>
                  <th>Booking Date</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReviews.map((r) => {
                  const rId = r._id || r.id;
                  const custName = r.user?.name || 'Customer';
                  const custEmail = r.user?.email || '';
                  const scName = r.serviceCenter?.name || 'Service Center';
                  const scCity = r.serviceCenter?.city || '';
                  const bookingDateStr = r.booking?.bookingDate
                    ? new Date(r.booking.bookingDate).toLocaleDateString('en-IN')
                    : 'N/A';
                  const createdDateStr = r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={rId}>
                      <td className="feature-name">
                        <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>{custName}</strong>
                        {custEmail && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {custEmail}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{scName}</strong>
                        {scCity && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>
                            {scCity}
                          </span>
                        )}
                      </td>
                      <td>{renderStars(r.rating)}</td>
                      <td style={{ maxWidth: '280px' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: r.comment ? 'var(--primary-dark)' : 'var(--text-secondary)',
                            fontStyle: r.comment ? 'normal' : 'italic',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {r.comment || '— No comment —'}
                        </span>
                      </td>
                      <td>{bookingDateStr}</td>
                      <td>{createdDateStr}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button type="button" className="icon-button" title="View Review Details" onClick={() => handleOpenViewModal(rId)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="icon-button" title="Edit Review" onClick={() => handleOpenEditModal(r)}>
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title="Delete Review"
                            onClick={() => setConfirmDeleteReview(r)}
                            style={{ color: '#DC2626' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION BAR */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-light)',
            }}
          >
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total reviews)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-card-secondary"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                style={{ padding: '0.4rem 0.85rem', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                className="btn-card-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                style={{ padding: '0.4rem 0.85rem', opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW REVIEW MODAL */}
      {(viewingReview || viewLoading) && (
        <div className="modal-overlay" onClick={() => setViewingReview(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Review Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingReview(null)}>
                <X size={20} />
              </button>
            </div>

            {viewLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                      {viewingReview.user?.name || 'Customer'}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {viewingReview.user?.email}
                    </span>
                  </div>
                  <div>{renderStars(viewingReview.rating)}</div>
                </div>

                <div className="car-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <strong>Service Center:</strong>
                    <div>{viewingReview.serviceCenter?.name || 'N/A'}</div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingReview.serviceCenter?.city}</span>
                  </div>

                  <div>
                    <strong>Booking Status:</strong>
                    <div>{viewingReview.booking?.status || 'COMPLETED'}</div>
                  </div>

                  <div>
                    <strong>Booking Date:</strong>
                    <div>
                      {viewingReview.booking?.bookingDate
                        ? new Date(viewingReview.booking.bookingDate).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <strong>Submitted Date:</strong>
                    <div>
                      {new Date(viewingReview.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Review Comment:</strong>
                    <div style={{ marginTop: '0.3rem', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.9rem', fontStyle: viewingReview.comment ? 'normal' : 'italic', color: viewingReview.comment ? 'var(--primary-dark)' : 'var(--text-secondary)' }}>
                      {viewingReview.comment || '— No comment provided —'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button type="button" className="btn-card-secondary" onClick={() => setViewingReview(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT REVIEW MODAL */}
      {editingReview && (
        <div className="modal-overlay" onClick={() => setEditingReview(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Review</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditingReview(null)}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Rating (1 - 5 Stars) *</label>
                <select
                  className="form-control"
                  value={editFormData.rating}
                  onChange={(e) => setEditFormData({ ...editFormData, rating: parseInt(e.target.value, 10) })}
                  required
                >
                  <option value="5">5 Stars - Excellent</option>
                  <option value="4">4 Stars - Good</option>
                  <option value="3">3 Stars - Average</option>
                  <option value="2">2 Stars - Poor</option>
                  <option value="1">1 Star - Terrible</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Review Comment</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Review feedback comments..."
                  value={editFormData.comment}
                  onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setEditingReview(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteReview && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteReview(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#DC2626' }}>Delete Review</h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmDeleteReview(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              This will permanently remove this review and may affect the service center's aggregate rating.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmDeleteReview(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                disabled={deleteLoading}
                onClick={handleDeleteReviewSubmit}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
