import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  X,
  Clock,
  Download,
  FileText,
} from 'lucide-react';
import { getBookings, updateBookingStatus, assignMechanic } from '../../api/bookings.api';
import { getAdminUsers } from '../../api/users.api';
import { downloadInvoice } from '../../api/invoices.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ServiceManagerBookings() {
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [viewingBooking, setViewingBooking] = useState(null);
  const [updatingStatusBooking, setUpdatingStatusBooking] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  const [assigningBooking, setAssigningBooking] = useState(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bookingsRes, mechanicsRes] = await Promise.all([
        getBookings(),
        getAdminUsers({ role: 'MECHANIC', limit: 100 }),
      ]);

      if (bookingsRes && bookingsRes.success && Array.isArray(bookingsRes.data)) {
        setBookings(bookingsRes.data);
      } else if (Array.isArray(bookingsRes)) {
        setBookings(bookingsRes);
      } else {
        throw new Error(bookingsRes?.message || 'Failed to fetch bookings list');
      }

      if (mechanicsRes && mechanicsRes.success && Array.isArray(mechanicsRes.users)) {
        setMechanics(mechanicsRes.users.filter((m) => m.isActive !== false));
      } else if (mechanicsRes && Array.isArray(mechanicsRes.data)) {
        setMechanics(mechanicsRes.data.filter((m) => m.isActive !== false));
      }
    } catch (err) {
      console.error('Error loading service manager bookings:', err.message);
      setError(err.data?.message || err.message || 'Unable to load bookings queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate allowed status transitions for lifecycle enforcement
  const getAllowedNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return ['CONFIRMED', 'CANCELLED'];
      case 'CONFIRMED':
        return ['IN_PROGRESS', 'CANCELLED'];
      case 'IN_PROGRESS':
        return ['COMPLETED', 'CANCELLED'];
      case 'RESCHEDULED':
        return ['CONFIRMED', 'IN_PROGRESS', 'CANCELLED'];
      default:
        return []; // COMPLETED & CANCELLED have no allowed status transitions
    }
  };

  const handleOpenStatusModal = (booking) => {
    setUpdatingStatusBooking(booking);
    const allowed = getAllowedNextStatuses(booking.status);
    setSelectedStatus(allowed.length > 0 ? allowed[0] : booking.status);
    setModalError(null);
  };

  const handleOpenAssignModal = (booking) => {
    setAssigningBooking(booking);
    setSelectedMechanicId(booking.mechanic?._id || booking.mechanic?.id || '');
    setModalError(null);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!updatingStatusBooking || !selectedStatus) return;

    try {
      setIsSubmitting(true);
      setModalError(null);
      const bId = updatingStatusBooking._id || updatingStatusBooking.id;
      const response = await updateBookingStatus(bId, selectedStatus);

      if (response && response.success) {
        setSuccessMsg(`Booking status updated to "${selectedStatus}" successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setUpdatingStatusBooking(null);
        fetchData();
      } else {
        throw new Error(response?.message || 'Failed to update booking status');
      }
    } catch (err) {
      console.error('Error updating status:', err.message);
      setModalError(err.data?.message || err.message || 'Failed to update booking status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningBooking || !selectedMechanicId) {
      setModalError('Please select an active technician.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);
      const bId = assigningBooking._id || assigningBooking.id;
      const response = await assignMechanic(bId, selectedMechanicId);

      if (response && response.success) {
        setSuccessMsg('Technician assigned to booking successfully.');
        setTimeout(() => setSuccessMsg(null), 4000);
        setAssigningBooking(null);
        fetchData();
      } else {
        throw new Error(response?.message || 'Failed to assign technician');
      }
    } catch (err) {
      console.error('Error assigning mechanic:', err.message);
      setModalError(err.data?.message || err.message || 'Failed to assign technician.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (invoiceId) => {
    if (!invoiceId || downloadingInvoiceId) return;

    try {
      setDownloadingInvoiceId(invoiceId);
      const { blob, filename } = await downloadInvoice(invoiceId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice PDF:', err.message);
      alert(err.message || 'Failed to download invoice PDF. Please try again.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;

      const cName = b.user?.name || '';
      const cPhone = b.user?.phone || '';
      const vehMake = b.vehicle?.make || '';
      const vehModel = b.vehicle?.model || '';
      const regNum = b.vehicle?.registrationNumber || '';
      const srvName = b.service?.name || '';
      const mechName = b.mechanic?.name || '';
      const bId = b._id || b.id || '';

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        cName.toLowerCase().includes(term) ||
        cPhone.toLowerCase().includes(term) ||
        vehMake.toLowerCase().includes(term) ||
        vehModel.toLowerCase().includes(term) ||
        regNum.toLowerCase().includes(term) ||
        srvName.toLowerCase().includes(term) ||
        mechName.toLowerCase().includes(term) ||
        bId.toLowerCase().includes(term);

      return matchStatus && matchSearch;
    });
  }, [bookings, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', label: 'Completed' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', label: 'In Progress' };
      case 'CONFIRMED':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563EB', label: 'Confirmed' };
      case 'RESCHEDULED':
        return { bg: 'rgba(6, 182, 212, 0.15)', color: '#0891B2', label: 'Rescheduled' };
      case 'CANCELLED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', label: 'Cancelled' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706', label: 'Pending' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
            Bookings Queue & Dispatch
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Inspect customer service bookings, assign technicians, track status progression, and access auto-generated invoices.
          </p>
        </div>
        <button type="button" className="btn-card-secondary" onClick={fetchData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} /> Refresh Queue
        </button>
      </div>

      {successMsg && (
        <div className="form-success-banner" role="status">
          <CheckCircle2 size={20} className="success-icon" />
          <div className="success-content">
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL BAR */}
      <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by customer, vehicle, reg number, mechanic, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#8B5CF6' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading service bookings queue...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Bookings</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchData} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Assigned Mechanic</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Invoice</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const bId = b._id || b.id;
                  const badge = getStatusBadge(b.status);
                  const customerName = b.user?.name || 'Customer';
                  const vehTitle = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : 'Vehicle';
                  const regNum = b.vehicle?.registrationNumber || '';
                  const srvName = b.service?.name || 'Service';
                  const allowedNext = getAllowedNextStatuses(b.status);

                  return (
                    <tr key={bId}>
                      <td>
                        <strong style={{ color: 'var(--primary-dark)', fontSize: '0.88rem' }}>
                          #{bId.substring(bId.length - 6).toUpperCase()}
                        </strong>
                      </td>
                      <td className="feature-name">
                        {customerName}
                        {b.user?.phone && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {b.user.phone}
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
                      <td>
                        {srvName}
                        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {formatCurrency(b.service?.price || b.amount || 0)}
                        </span>
                      </td>
                      <td>
                        {b.mechanic ? (
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2563EB', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            {b.mechanic.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        {formatDate(b.bookingDate)}
                        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {b.bookingTime || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: badge.bg, color: badge.color, display: 'inline-flex' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        {b.invoice ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8B5CF6' }}>
                              {b.invoice.invoiceNumber}
                            </span>
                            <button
                              type="button"
                              className="btn-card-secondary"
                              onClick={() => handleDownloadPdf(b.invoice._id || b.invoice.id)}
                              disabled={downloadingInvoiceId === (b.invoice._id || b.invoice.id)}
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              {downloadingInvoiceId === (b.invoice._id || b.invoice.id) ? (
                                <Loader2 size={12} className="spinning-loader" style={{ animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <Download size={12} />
                              )}
                              PDF
                            </button>
                          </div>
                        ) : b.status === 'COMPLETED' ? (
                          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>
                            Invoice Generated
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn-card-secondary"
                            onClick={() => setViewingBooking(b)}
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              className="btn-card-secondary"
                              onClick={() => handleOpenAssignModal(b)}
                              style={{ padding: '0.3rem 0.5rem' }}
                              title="Assign Mechanic"
                            >
                              <UserCheck size={15} />
                            </button>
                          )}
                          {allowedNext.length > 0 && (
                            <button
                              type="button"
                              className="btn-card-secondary"
                              onClick={() => handleOpenStatusModal(b)}
                              style={{ padding: '0.3rem 0.5rem' }}
                              title="Update Status"
                            >
                              <Clock size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    No bookings found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingBooking && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#8B5CF6" />
                Booking Overview #{viewingBooking._id?.substring(viewingBooking._id.length - 6).toUpperCase()}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingBooking(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', backgroundColor: 'var(--bg-light)', padding: '0.85rem', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Customer</span>
                  <strong style={{ display: 'block', color: 'var(--primary-dark)' }}>{viewingBooking.user?.name || 'Customer'}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{viewingBooking.user?.phone || viewingBooking.user?.email}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Vehicle</span>
                  <strong style={{ display: 'block', color: 'var(--primary-dark)' }}>{viewingBooking.vehicle ? `${viewingBooking.vehicle.make} ${viewingBooking.vehicle.model}` : 'Vehicle'}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{viewingBooking.vehicle?.registrationNumber}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Service Requested</span>
                  <strong style={{ display: 'block', color: 'var(--primary-dark)' }}>{viewingBooking.service?.name || 'Service'}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>{formatCurrency(viewingBooking.service?.price || viewingBooking.amount)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Assigned Technician</span>
                  <strong style={{ display: 'block', color: viewingBooking.mechanic ? '#2563EB' : 'var(--text-secondary)' }}>
                    {viewingBooking.mechanic ? viewingBooking.mechanic.name : 'Unassigned'}
                  </strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Service Center</span>
                <div style={{ fontWeight: 600 }}>{viewingBooking.serviceCenter?.name || 'Workshop'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingBooking.serviceCenter?.address}, {viewingBooking.serviceCenter?.city}</div>
              </div>

              {viewingBooking.invoice && (
                <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', padding: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Auto-Generated Invoice</span>
                    <strong style={{ display: 'block', color: '#8B5CF6' }}>{viewingBooking.invoice.invoiceNumber}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>Total: {formatCurrency(viewingBooking.invoice.total)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-card-primary"
                    onClick={() => handleDownloadPdf(viewingBooking.invoice._id || viewingBooking.invoice.id)}
                    disabled={downloadingInvoiceId === (viewingBooking.invoice._id || viewingBooking.invoice.id)}
                    style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                  >
                    <Download size={14} style={{ marginRight: '0.3rem' }} /> Download PDF
                  </button>
                </div>
              )}

              {viewingBooking.notes && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Notes</span>
                  <p style={{ marginTop: '0.2rem', padding: '0.65rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {viewingBooking.notes}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setViewingBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MECHANIC MODAL */}
      {assigningBooking && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={20} color="#8B5CF6" />
                Assign Technician
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setAssigningBooking(null)}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>Booking #{assigningBooking._id?.substring(assigningBooking._id.length - 6).toUpperCase()}</strong> - {assigningBooking.service?.name}
                  {assigningBooking.status === 'PENDING' && (
                    <span style={{ display: 'block', color: '#10B981', marginTop: '0.3rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      Note: Assigning a technician will automatically confirm this booking (PENDING → CONFIRMED).
                    </span>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' }}>
                    Select Technician *
                  </label>
                  <select
                    className="form-control"
                    required
                    value={selectedMechanicId}
                    onChange={(e) => setSelectedMechanicId(e.target.value)}
                  >
                    <option value="">-- Choose Active Technician --</option>
                    {mechanics.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setAssigningBooking(null)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={isSubmitting} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {updatingStatusBooking && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="#8B5CF6" />
                Advance Service Status
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setUpdatingStatusBooking(null)}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  Current Status: <strong style={{ color: '#8B5CF6' }}>{updatingStatusBooking.status}</strong>
                  {updatingStatusBooking.status === 'IN_PROGRESS' && (
                    <span style={{ display: 'block', color: '#10B981', marginTop: '0.3rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      Note: Marking as COMPLETED will automatically generate a customer invoice.
                    </span>
                  )}
                </div>

                {getAllowedNextStatuses(updatingStatusBooking.status).length > 0 ? (
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' }}>
                      Select Next Allowed Status *
                    </label>
                    <select
                      className="form-control"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      {getAllowedNextStatuses(updatingStatusBooking.status).map((st) => (
                        <option key={st} value={st}>
                          {st === 'CONFIRMED' ? 'CONFIRMED (Confirm Appointment)' : st === 'IN_PROGRESS' ? 'IN_PROGRESS (Start Service Work)' : st === 'COMPLETED' ? 'COMPLETED (Finish Service & Invoice)' : st}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '0.5rem' }}>
                    This booking is in state <strong>{updatingStatusBooking.status}</strong>. No further status changes are permitted.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setUpdatingStatusBooking(null)} disabled={isSubmitting}>
                  Cancel
                </button>
                {getAllowedNextStatuses(updatingStatusBooking.status).length > 0 && (
                  <button type="submit" className="btn-card-primary" disabled={isSubmitting} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
                    {isSubmitting ? 'Saving...' : 'Update Status'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
