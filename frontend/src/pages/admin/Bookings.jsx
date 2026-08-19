import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Eye,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  UserCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  MapPin,
  Car,
  DollarSign,
} from 'lucide-react';
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
  assignMechanic,
  cancelBooking,
} from '../../api/bookings.api';
import { formatCurrency } from '../../utils/formatters';
import { getAdminUsers } from '../../api/users.api';

export default function AdminBookings() {
  // Main data states
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filter & Pagination states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal states
  const [viewingBooking, setViewingBooking] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [updatingStatusBooking, setUpdatingStatusBooking] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const [assigningMechanicBooking, setAssigningMechanicBooking] = useState(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch Bookings & Mechanics List
  const fetchBookingsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings and mechanics list concurrently
      const [bookingsRes, mechanicsRes] = await Promise.all([
        getBookings(statusFilter ? { status: statusFilter } : {}),
        getAdminUsers({ role: 'MECHANIC', limit: 100 }).catch(() => null),
      ]);

      if (bookingsRes && bookingsRes.success) {
        setBookings(bookingsRes.data || []);
      } else {
        throw new Error(bookingsRes?.message || 'Failed to fetch bookings list');
      }

      if (mechanicsRes && mechanicsRes.success && mechanicsRes.data) {
        setMechanics(mechanicsRes.data);
      }
    } catch (err) {
      console.error('Error fetching admin bookings data:', err);
      setError(err.data?.message || err.message || 'Unable to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookingsData();
  }, [fetchBookingsData]);

  // Client-side search filtering across populated fields
  const filteredBookings = bookings.filter((b) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();

    const bookingId = (b._id || b.id || '').toLowerCase();
    const customerName = (b.user?.name || '').toLowerCase();
    const customerEmail = (b.user?.email || '').toLowerCase();
    const customerPhone = (b.user?.phone || '').toLowerCase();
    const vehMake = (b.vehicle?.make || '').toLowerCase();
    const vehModel = (b.vehicle?.model || '').toLowerCase();
    const regNum = (b.vehicle?.registrationNumber || '').toLowerCase();
    const serviceName = (b.service?.name || '').toLowerCase();
    const centerName = (b.serviceCenter?.name || '').toLowerCase();
    const mechanicName = (b.mechanic?.name || '').toLowerCase();

    return (
      bookingId.includes(term) ||
      customerName.includes(term) ||
      customerEmail.includes(term) ||
      customerPhone.includes(term) ||
      vehMake.includes(term) ||
      vehModel.includes(term) ||
      regNum.includes(term) ||
      serviceName.includes(term) ||
      centerName.includes(term) ||
      mechanicName.includes(term)
    );
  });

  // Client-side pagination calculation
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedBookings = filteredBookings.slice((page - 1) * limit, page * limit);

  // Status Metrics Calculation
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    inProgress: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  // View Booking Modal Handler
  const handleOpenViewModal = async (bookingId) => {
    try {
      setViewLoading(true);
      setViewingBooking(null);
      const res = await getBookingById(bookingId);
      if (res && res.success && res.data) {
        setViewingBooking(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch booking details');
      }
    } catch (err) {
      console.error('Error viewing booking details:', err);
      alert(err.data?.message || err.message || 'Could not load booking details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Update Status Handler
  const handleSaveStatusUpdate = async (e) => {
    e.preventDefault();
    if (!updatingStatusBooking || !selectedStatus) return;
    const bId = updatingStatusBooking._id || updatingStatusBooking.id;

    try {
      setStatusLoading(true);
      const res = await updateBookingStatus(bId, selectedStatus);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Booking status updated to ${selectedStatus} successfully.` });
        setUpdatingStatusBooking(null);
        fetchBookingsData();
      } else {
        throw new Error(res?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert(err.data?.message || err.message || 'Status update failed.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Assign Mechanic Handler
  const handleSaveMechanicAssignment = async (e) => {
    e.preventDefault();
    if (!assigningMechanicBooking) return;
    const bId = assigningMechanicBooking._id || assigningMechanicBooking.id;

    if (!selectedMechanicId) {
      alert('Please select a mechanic to assign.');
      return;
    }

    try {
      setAssignLoading(true);
      const res = await assignMechanic(bId, selectedMechanicId);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: 'Mechanic assigned to booking successfully.' });
        setAssigningMechanicBooking(null);
        fetchBookingsData();
      } else {
        throw new Error(res?.message || 'Failed to assign mechanic');
      }
    } catch (err) {
      console.error('Error assigning mechanic:', err);
      alert(err.data?.message || err.message || 'Mechanic assignment failed.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Cancel Booking Handler
  const handleConfirmCancelBooking = async () => {
    if (!cancellingBooking) return;
    const bId = cancellingBooking._id || cancellingBooking.id;

    try {
      setCancelLoading(true);
      const res = await cancelBooking(bId);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: 'Booking cancelled successfully.' });
        setCancellingBooking(null);
        fetchBookingsData();
      } else {
        throw new Error(res?.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.data?.message || err.message || 'Booking cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563EB', text: 'CONFIRMED' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706', text: 'IN PROGRESS' };
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', text: 'COMPLETED' };
      case 'CANCELLED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#DC2626', text: 'CANCELLED' };
      case 'RESCHEDULED':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#7C3AED', text: 'RESCHEDULED' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#4B5563', text: 'PENDING' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CalendarIcon size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Booking Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Manage customer service appointments, booking status, and mechanic assignments.
          </p>
        </div>

        <button
          type="button"
          className="btn-card-secondary"
          onClick={fetchBookingsData}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
        >
          <RefreshCw size={16} />
          <span>Refresh Bookings</span>
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
        <div className="search-filter-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* SEARCH INPUT */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search customer, vehicle, service, workshop, or booking ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* STATUS DROPDOWN FILTER */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="RESCHEDULED">RESCHEDULED</option>
          </select>
        </div>
      </div>

      {/* SUMMARY STATS STRIP */}
      <div className="dashboard-stats-grid">
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Appointments</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{stats.total}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#4B5563', marginTop: '0.2rem' }}>{stats.pending}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Confirmed / In Progress</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#2563EB', marginTop: '0.2rem' }}>
            {stats.confirmed + stats.inProgress}
          </strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#059669', marginTop: '0.2rem' }}>{stats.completed}</strong>
        </div>
      </div>

      {/* MAIN BOOKINGS TABLE SECTION */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching service appointments...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Bookings</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchBookingsData}>
            Try Again
          </button>
        </div>
      ) : paginatedBookings.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <CalendarIcon size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>No Bookings Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || statusFilter ? 'No service bookings match your filter criteria.' : 'There are currently no service appointments booked.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-responsive-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Center</th>
                  <th>Date & Slot</th>
                  <th>Amount</th>
                  <th>Mechanic</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b) => {
                  const bId = b._id || b.id;
                  const shortId = bId.substring(bId.length - 6).toUpperCase();
                  const customerName = b.user?.name || 'Customer';
                  const customerContact = b.user?.phone || b.user?.email || '';
                  const vehTitle = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : 'Vehicle';
                  const regNum = b.vehicle?.registrationNumber || '';
                  const srvName = b.service?.name || 'Service';
                  const centerName = b.serviceCenter?.name || 'Workshop';
                  const mechanicName = b.mechanic ? b.mechanic.name : 'Unassigned';
                  const badge = getStatusBadgeStyle(b.status);
                  const dateStr = b.bookingDate
                    ? new Date(b.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A';

                  const canCancel = b.status !== 'COMPLETED' && b.status !== 'CANCELLED';

                  return (
                    <tr key={bId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-accent)', fontSize: '0.85rem' }}>
                        #{shortId}
                      </td>
                      <td className="feature-name">
                        {customerName}
                        {customerContact && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {customerContact}
                          </span>
                        )}
                      </td>
                      <td>
                        {vehTitle}
                        {regNum && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {regNum}
                          </span>
                        )}
                      </td>
                      <td>{srvName}</td>
                      <td>{centerName}</td>
                      <td>
                        {dateStr}
                        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {b.bookingTime || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                        {formatCurrency(b.service?.price || b.amount || 0)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: b.mechanic ? 'rgba(59, 130, 246, 0.12)' : 'rgba(243, 244, 246, 1)',
                            color: b.mechanic ? '#2563EB' : '#6B7280',
                            display: 'inline-block',
                          }}
                        >
                          {mechanicName}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            display: 'inline-block',
                          }}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          {/* VIEW BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="View Booking Details"
                            onClick={() => handleOpenViewModal(bId)}
                          >
                            <Eye size={16} />
                          </button>

                          {/* UPDATE STATUS BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Update Status"
                            onClick={() => {
                              setUpdatingStatusBooking(b);
                              setSelectedStatus(b.status);
                            }}
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          {/* ASSIGN MECHANIC BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Assign / Reassign Mechanic"
                            onClick={() => {
                              setAssigningMechanicBooking(b);
                              setSelectedMechanicId(b.mechanic ? b.mechanic._id || b.mechanic.id : '');
                            }}
                            style={{ color: '#2563EB' }}
                          >
                            <Wrench size={16} />
                          </button>

                          {/* CANCEL BUTTON */}
                          {canCancel && (
                            <button
                              type="button"
                              className="icon-button"
                              title="Cancel Booking"
                              onClick={() => setCancellingBooking(b)}
                              style={{ color: '#DC2626' }}
                            >
                              <XCircle size={16} />
                            </button>
                          )}
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
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} matching appointments)
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

      {/* VIEW BOOKING DETAIL MODAL */}
      {(viewingBooking || viewLoading) && (
        <div className="modal-overlay" onClick={() => setViewingBooking(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Booking Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingBooking(null)}>
                <X size={20} />
              </button>
            </div>

            {viewLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Booking Reference</span>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
                      #{viewingBooking._id?.toUpperCase()}
                    </h4>
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: getStatusBadgeStyle(viewingBooking.status).bg,
                      color: getStatusBadgeStyle(viewingBooking.status).color,
                    }}
                  >
                    {viewingBooking.status}
                  </span>
                </div>

                <div className="car-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <strong>Customer:</strong>
                    <div style={{ marginTop: '0.2rem' }}>{viewingBooking.user?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingBooking.user?.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingBooking.user?.phone}</div>
                  </div>

                  <div>
                    <strong>Vehicle:</strong>
                    <div style={{ marginTop: '0.2rem' }}>
                      {viewingBooking.vehicle?.make} {viewingBooking.vehicle?.model}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Reg: {viewingBooking.vehicle?.registrationNumber}
                    </div>
                  </div>

                  <div>
                    <strong>Service Requested:</strong>
                    <div style={{ marginTop: '0.2rem' }}>{viewingBooking.service?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category: {viewingBooking.service?.category}</div>
                  </div>

                  <div>
                    <strong>Service Center:</strong>
                    <div style={{ marginTop: '0.2rem' }}>{viewingBooking.serviceCenter?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingBooking.serviceCenter?.city}</div>
                  </div>

                  <div>
                    <strong>Appointment Slot:</strong>
                    <div style={{ marginTop: '0.2rem' }}>
                      {new Date(viewingBooking.bookingDate).toLocaleDateString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time: {viewingBooking.bookingTime}</div>
                  </div>

                  <div>
                    <strong>Total Amount:</strong>
                    <div style={{ marginTop: '0.2rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                      {formatCurrency(viewingBooking.service?.price || viewingBooking.amount)}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Assigned Mechanic:</strong>
                    <div style={{ marginTop: '0.2rem', fontWeight: 600, color: viewingBooking.mechanic ? '#2563EB' : 'var(--text-secondary)' }}>
                      {viewingBooking.mechanic ? `${viewingBooking.mechanic.name} (${viewingBooking.mechanic.phone || viewingBooking.mechanic.email})` : 'Unassigned'}
                    </div>
                  </div>

                  {viewingBooking.notes && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Customer Notes:</strong>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        "{viewingBooking.notes}"
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button type="button" className="btn-card-secondary" onClick={() => setViewingBooking(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {updatingStatusBooking && (
        <div className="modal-overlay" onClick={() => setUpdatingStatusBooking(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Update Booking Status</h3>
              <button type="button" className="modal-close-btn" onClick={() => setUpdatingStatusBooking(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Appointment Reference</span>
                <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                  #{updatingStatusBooking._id?.toUpperCase()}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Select New Status *</label>
                <select
                  className="form-control"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  required
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="RESCHEDULED">RESCHEDULED</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setUpdatingStatusBooking(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={statusLoading}>
                  {statusLoading ? 'Updating Status...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MECHANIC MODAL */}
      {assigningMechanicBooking && (
        <div className="modal-overlay" onClick={() => setAssigningMechanicBooking(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Mechanic</h3>
              <button type="button" className="modal-close-btn" onClick={() => setAssigningMechanicBooking(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMechanicAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Service requested for</span>
                <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                  {assigningMechanicBooking.service?.name || 'Service'} ({assigningMechanicBooking.serviceCenter?.name || 'Center'})
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Select Mechanic *</label>
                {mechanics.length > 0 ? (
                  <select
                    className="form-control"
                    value={selectedMechanicId}
                    onChange={(e) => setSelectedMechanicId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Available Mechanic --</option>
                    {mechanics.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.name} ({m.phone || m.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    No active mechanics found in system. Please create a user with role MECHANIC first.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setAssigningMechanicBooking(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-card-primary"
                  disabled={assignLoading || mechanics.length === 0}
                >
                  {assignLoading ? 'Assigning...' : 'Assign Mechanic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL BOOKING CONFIRMATION MODAL */}
      {cancellingBooking && (
        <div className="modal-overlay" onClick={() => setCancellingBooking(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#DC2626' }}>Cancel Booking</h3>
              <button type="button" className="modal-close-btn" onClick={() => setCancellingBooking(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to cancel booking appointment for{' '}
              <strong>{cancellingBooking.user?.name || 'Customer'}</strong> ({cancellingBooking.service?.name})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setCancellingBooking(null)}>
                Dismiss
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                disabled={cancelLoading}
                onClick={handleConfirmCancelBooking}
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
