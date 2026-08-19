import { useState, useEffect } from 'react';
import { Search, Eye, Star, Loader2, AlertCircle, CheckCircle2, UserCheck, X, Download } from 'lucide-react';
import { getBookings, getServiceHistory } from '../../api/bookings.api';
import { getReviews, createReview } from '../../api/reviews.api';
import { downloadInvoice } from '../../api/invoices.api';

export default function ServiceHistory() {
  const [completedBookings, setCompletedBookings] = useState([]);
  const [reviewsMap, setReviewsMap] = useState({}); // bookingId -> reviewObj
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('All Vehicles');
  const [selectedService, setSelectedService] = useState('All Services');

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchServiceHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const [historyRes, reviewsRes] = await Promise.all([
        getServiceHistory().catch(() => getBookings()),
        getReviews().catch(() => ({ data: [] })),
      ]);

      const rawBookings = historyRes.data || historyRes || [];
      const completed = Array.isArray(rawBookings)
        ? rawBookings.filter((b) => b.status === 'COMPLETED')
        : [];

      setCompletedBookings(completed);

      // Map existing reviews by bookingId
      const reviewsList = reviewsRes.data || reviewsRes || [];
      const map = {};
      if (Array.isArray(reviewsList)) {
        reviewsList.forEach((r) => {
          const bId = typeof r.booking === 'object' ? r.booking._id : r.booking;
          if (bId) map[bId] = r;
        });
      }
      setReviewsMap(map);
    } catch (err) {
      console.error('Error fetching service history:', err.message);
      setError(err.data?.message || err.message || 'Failed to load service history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invId, invNum) => {
    if (!invId) return;
    setDownloadingInvoiceId(invId);
    try {
      const { blob, filename } = await downloadInvoice(invId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert(err.message || 'Failed to download invoice.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  useEffect(() => {
    fetchServiceHistory();
  }, []);

  // Compute unique vehicles and services for filter dropdowns
  const vehicleOptions = ['All Vehicles'];
  const serviceOptions = ['All Services'];

  completedBookings.forEach((b) => {
    const vName = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : '';
    if (vName && !vehicleOptions.includes(vName)) vehicleOptions.push(vName);

    const sName = b.service?.name || '';
    if (sName && !serviceOptions.includes(sName)) serviceOptions.push(sName);
  });

  const filteredHistory = completedBookings.filter((b) => {
    const vName = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : '';
    const sName = b.service?.name || '';
    const cName = b.serviceCenter?.name || '';

    const matchesSearch =
      !searchTerm.trim() ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVeh = selectedVehicle === 'All Vehicles' || vName === selectedVehicle;
    const matchesSrv = selectedService === 'All Services' || sName === selectedService;

    return matchesSearch && matchesVeh && matchesSrv;
  });

  const openReviewModal = (booking) => {
    setActiveBooking(booking);
    const existing = reviewsMap[booking._id || booking.id];
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment || '');
    } else {
      setRating(5);
      setComment('');
    }
    setReviewError('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeBooking) return;

    setReviewError('');
    setIsSubmittingReview(true);

    try {
      const response = await createReview({
        booking: activeBooking._id || activeBooking.id,
        rating: Number(rating),
        comment: comment ? comment.trim() : undefined,
      });

      if (response && response.success) {
        setSuccessMsg('Thank you! Your rating & review has been submitted.');
        setShowReviewModal(false);
        fetchServiceHistory();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        throw new Error(response.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      setReviewError(err.data?.message || err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
          Service History
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          View and filter past service records and maintenance details.
        </p>
      </div>

      {successMsg && (
        <div className="form-success-banner" role="status">
          <CheckCircle2 size={20} className="success-icon" />
          <div className="success-content">
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="search-filter-card">
        <div className="search-filter-grid">
          <div className="input-with-icon">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by vehicle, service, or center..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="category-select"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            {vehicleOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select
            className="category-select"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            {serviceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading service history records...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Failed to Load Service History</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchServiceHistory}>
            Try Again
          </button>
        </div>
      ) : (
        /* TABLE */
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Completed Date</th>
                <th>Service Center</th>
                <th>Amount</th>
                <th>Invoice</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((row) => {
                  const bId = row._id || row.id;
                  const vName = row.vehicle ? `${row.vehicle.make || ''} ${row.vehicle.model || ''}`.trim() : 'Vehicle';
                  const regNum = row.vehicle?.registrationNumber || '';
                  const vMileage = row.vehicle?.mileage ? `${row.vehicle.mileage} km` : null;
                  const sName = row.service?.name || 'Service';
                  const cName = row.serviceCenter?.name || 'CarFix Hub';
                  const formattedDate = new Date(row.bookingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const existingReview = reviewsMap[bId];
                  const invoiceObj = row.invoice;

                  return (
                    <tr key={bId}>
                      <td className="feature-name">
                        {vName}
                        {regNum && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {regNum} {vMileage ? `• ${vMileage}` : ''}
                          </span>
                        )}
                      </td>
                      <td>{sName}</td>
                      <td>{formattedDate}</td>
                      <td>{cName}</td>
                      <td style={{ fontWeight: '700' }}>₹{row.amount}</td>
                      <td>
                        {invoiceObj ? (
                          <button
                            type="button"
                            className="btn-card-secondary"
                            onClick={() => handleDownloadInvoice(invoiceObj._id, invoiceObj.invoiceNumber)}
                            disabled={downloadingInvoiceId === invoiceObj._id}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            {downloadingInvoiceId === invoiceObj._id ? (
                              <>
                                <Loader2 size={12} className="spinning-loader" style={{ animation: 'spin 1s linear infinite' }} /> PDF
                              </>
                            ) : (
                              <>
                                <Download size={12} /> {invoiceObj.invoiceNumber || 'Invoice'}
                              </>
                            )}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <span className="status-badge" style={{ display: 'inline-flex' }}>
                          <span className="status-dot"></span>
                          Completed
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-card-secondary"
                          onClick={() => openReviewModal(row)}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {existingReview ? (
                            <>
                              <Star size={14} fill="#F59E0B" color="#F59E0B" /> {existingReview.rating}★ Rated
                            </>
                          ) : (
                            <>
                              <Star size={14} /> Rate Service
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No completed service history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* RATE / REVIEW SERVICE MODAL */}
      {showReviewModal && activeBooking && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Rate Your Service Experience</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowReviewModal(false)} disabled={isSubmittingReview}>
                <X size={20} />
              </button>
            </div>

            {reviewError && (
              <div className="pricing-alert-box" style={{ marginBottom: '1rem', padding: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                <AlertCircle size={18} className="alert-icon" style={{ color: '#ef4444' }} />
                <div className="alert-text">
                  <p style={{ color: '#ef4444', fontSize: '0.88rem', fontWeight: 500 }}>{reviewError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--primary-dark)', display: 'block', fontSize: '1rem' }}>
                  {activeBooking.service?.name}
                </strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Vehicle: {activeBooking.vehicle?.make} {activeBooking.vehicle?.model} ({activeBooking.vehicle?.registrationNumber})
                </span>
                <span style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Center: {activeBooking.serviceCenter?.name}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Rating (1 to 5 Stars) *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <button
                      key={starNum}
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.3rem',
                      }}
                      onClick={() => setRating(starNum)}
                    >
                      <Star
                        size={28}
                        fill={starNum <= rating ? '#F59E0B' : 'none'}
                        color={starNum <= rating ? '#F59E0B' : 'var(--border-color)'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review Comment (Optional)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Share details about your service experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isSubmittingReview}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowReviewModal(false)} disabled={isSubmittingReview}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={isSubmittingReview}>
                  {isSubmittingReview ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
