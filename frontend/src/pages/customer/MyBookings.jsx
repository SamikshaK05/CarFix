import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Calendar, CheckCircle2, AlertCircle, Loader2, UserCheck, FileText } from 'lucide-react';
import { getBookings, cancelBooking } from '../../api/bookings.api';

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancellingId, setCancellingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchCustomerBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBookings();
      const rawData = response.data || response;
      const list = Array.isArray(rawData) ? rawData : [];
      setBookings(list);
    } catch (err) {
      console.error('Error fetching bookings:', err.message);
      setError(err.data?.message || err.message || 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerBookings();
  }, []);

  const handleCancel = async (bookingId, serviceName) => {
    if (!window.confirm(`Are you sure you want to cancel the booking for "${serviceName}"?`)) {
      return;
    }

    setCancellingId(bookingId);
    setActionError('');

    try {
      const response = await cancelBooking(bookingId);
      if (response && response.success) {
        setSuccessMsg(`Booking for "${serviceName}" cancelled successfully.`);
        fetchCustomerBookings();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        throw new Error(response.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setActionError(err.data?.message || err.message || 'Failed to cancel booking. It may already be completed or cancelled.');
    } finally {
      setCancellingId(null);
    }
  };

  // Tab counts
  const upcomingList = bookings.filter((b) =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'].includes(b.status)
  );
  const completedList = bookings.filter((b) => b.status === 'COMPLETED');
  const cancelledList = bookings.filter((b) => b.status === 'CANCELLED');

  const filteredBookings =
    activeTab === 'upcoming'
      ? upcomingList
      : activeTab === 'completed'
      ? completedList
      : activeTab === 'cancelled'
      ? cancelledList
      : bookings;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
          My Bookings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Track and manage your upcoming, completed, and past service appointments.
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

      {actionError && (
        <div className="pricing-alert-box" style={{ padding: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <AlertCircle size={20} className="alert-icon" style={{ color: '#ef4444' }} />
          <div className="alert-text">
            <p style={{ color: '#ef4444', fontWeight: 500 }}>{actionError}</p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="filter-container" style={{ justifyContent: 'flex-start' }}>
        <div className="filter-bar">
          <button
            type="button"
            className={`filter-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingList.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedList.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({cancelledList.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading customer appointments...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Failed to Load Bookings</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchCustomerBookings}>
            Try Again
          </button>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredBookings.map((b) => {
            const bId = b._id || b.id;
            const vehName = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : 'Vehicle';
            const regNum = b.vehicle?.registrationNumber || 'N/A';
            const serviceName = b.service?.name || 'Service';
            const centerName = b.serviceCenter?.name || 'CarFix Workshop';
            const formattedDate = new Date(b.bookingDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            const isEligibleToCancel = ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(b.status);

            return (
              <div
                key={bId}
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  opacity: cancellingId === bId ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
                      {vehName} – {serviceName}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Booking Ref: {bId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <span className="status-badge">
                    <span className="status-dot"></span>
                    {b.status}
                  </span>
                </div>

                <div className="car-info-grid" style={{ fontSize: '0.95rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Service Center</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-dark)' }}>
                      <MapPin size={14} color="var(--primary-accent)" />
                      {centerName}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Date & Time</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-dark)' }}>
                      <Clock size={14} color="var(--primary-accent)" />
                      {formattedDate} ({b.bookingTime})
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Registration</span>
                    <strong style={{ color: 'var(--primary-dark)' }}>{regNum}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Total Amount</span>
                    <strong style={{ color: 'var(--primary-accent)' }}>₹{b.amount}</strong>
                  </div>
                </div>

                {b.mechanic && (
                  <div style={{ backgroundColor: 'var(--bg-light)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={16} color="var(--primary-accent)" />
                    <span>Assigned Mechanic: <strong>{b.mechanic.name}</strong> ({b.mechanic.phone || b.mechanic.email})</span>
                  </div>
                )}

                {b.notes && (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <strong>Notes:</strong> {b.notes}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  {isEligibleToCancel && (
                    <button
                      type="button"
                      className="btn-card-secondary"
                      onClick={() => handleCancel(bId, serviceName)}
                      disabled={cancellingId === bId}
                      style={{ color: '#DC2626' }}
                    >
                      {cancellingId === bId ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                  <Link to="/customer/book-service" className="btn-card-primary" style={{ textDecoration: 'none' }}>
                    Book Another Service
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Calendar size={40} style={{ color: 'var(--text-secondary)', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
            No {activeTab !== 'all' ? activeTab : ''} bookings found
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
            {activeTab === 'upcoming'
              ? 'You have no active or upcoming service appointments scheduled.'
              : activeTab === 'completed'
              ? 'No completed service history recorded yet.'
              : activeTab === 'cancelled'
              ? 'No cancelled appointments.'
              : 'You have not placed any service bookings yet.'}
          </p>
          <Link to="/customer/book-service" className="btn-card-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            Schedule a Service Now
          </Link>
        </div>
      )}
    </div>
  );
}
