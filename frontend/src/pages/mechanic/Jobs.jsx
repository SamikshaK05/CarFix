import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  Wrench,
  User,
  Car,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  RefreshCw,
  X,
  Play,
  Check,
  Download,
} from 'lucide-react';
import { getBookings, updateBookingStatus } from '../../api/bookings.api';
import { downloadInvoice } from '../../api/invoices.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function MechanicJobs() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBookings();
      if (response && response.success && Array.isArray(response.data)) {
        setBookings(response.data);
      } else if (Array.isArray(response)) {
        setBookings(response);
      } else {
        throw new Error(response?.message || 'Failed to fetch assigned service jobs');
      }
    } catch (err) {
      console.error('Error loading mechanic jobs:', err.message);
      setError(err.data?.message || err.message || 'Unable to load assigned jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStartService = async (booking) => {
    const bId = booking._id || booking.id;
    try {
      setIsUpdating(true);
      setSuccessMsg(null);
      setError(null);
      const response = await updateBookingStatus(bId, 'IN_PROGRESS');

      if (response && response.success) {
        setSuccessMsg(`Service job #${bId.substring(bId.length - 6).toUpperCase()} started (IN_PROGRESS).`);
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchJobs();
      } else {
        throw new Error(response?.message || 'Failed to start service job');
      }
    } catch (err) {
      console.error('Error starting service job:', err.message);
      alert(err.data?.message || err.message || 'Failed to start service job.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteService = async (booking) => {
    const bId = booking._id || booking.id;
    try {
      setIsUpdating(true);
      setSuccessMsg(null);
      setError(null);
      const response = await updateBookingStatus(bId, 'COMPLETED');

      if (response && response.success) {
        setSuccessMsg(`Service job #${bId.substring(bId.length - 6).toUpperCase()} completed successfully. Customer invoice generated.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchJobs();
      } else {
        throw new Error(response?.message || 'Failed to complete service job');
      }
    } catch (err) {
      console.error('Error completing service job:', err.message);
      alert(err.data?.message || err.message || 'Failed to complete service job.');
    } finally {
      setIsUpdating(false);
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
            Assigned Service Jobs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Inspect vehicle technical requirements, start service execution, and mark completed jobs.
          </p>
        </div>
        <button type="button" className="btn-card-secondary" onClick={fetchJobs} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
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
              placeholder="Search by customer, vehicle, reg number, or service name..."
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
              style={{ width: '100%' }}
            >
              <option value="ALL">All Jobs</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* STATUS PILL BUTTONS */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: statusFilter === st ? '#3B82F6' : 'var(--border-color)',
                backgroundColor: statusFilter === st ? '#3B82F6' : 'var(--white)',
                color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {st === 'ALL' ? 'All Assigned Jobs' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN JOBS TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading assigned service queue...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Jobs</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchJobs} style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}>
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
                <th>Requested Service</th>
                <th>Scheduled Date & Time</th>
                <th>Status</th>
                <th>Invoice</th>
                <th style={{ textAlign: 'center' }}>Workflow Action</th>
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

                  return (
                    <tr key={bId}>
                      <td>
                        <strong style={{ color: 'var(--primary-dark)', fontSize: '0.88rem' }}>
                          #{bId.substring(bId.length - 6).toUpperCase()}
                        </strong>
                      </td>
                      <td className="feature-name">
                        <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{customerName}</div>
                        {b.user?.phone && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {b.user.phone}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{vehTitle}</div>
                        {regNum && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>
                            {regNum}
                          </span>
                        )}
                      </td>
                      <td>
                        {srvName}
                        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                          {formatCurrency(b.service?.price || b.amount || 0)}
                        </span>
                      </td>
                      <td>
                        {formatDate(b.bookingDate)}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>
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
                          {b.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="btn-card-primary"
                              onClick={() => handleStartService(b)}
                              disabled={isUpdating}
                              style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Play size={13} /> Start Service
                            </button>
                          )}
                          {b.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              className="btn-card-primary"
                              onClick={() => handleCompleteService(b)}
                              disabled={isUpdating}
                              style={{ backgroundColor: '#10B981', borderColor: '#10B981', padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Check size={13} /> Complete Service
                            </button>
                          )}
                          <Link
                            to={`/mechanic/jobs/${bId}`}
                            className="btn-card-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                            title="Inspect Job Specs"
                          >
                            Details <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    No assigned service jobs found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
