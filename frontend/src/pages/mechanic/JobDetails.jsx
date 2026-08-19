import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  User,
  Car,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Play,
  Check,
  Download,
} from 'lucide-react';
import { getBookingById, updateBookingStatus } from '../../api/bookings.api';
import { downloadInvoice } from '../../api/invoices.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function MechanicJobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBookingById(id);
      if (response && response.success && response.data) {
        setBooking(response.data);
      } else {
        throw new Error(response?.message || 'Service job not found');
      }
    } catch (err) {
      console.error('Error loading job details:', err.message);
      setError(err.data?.message || err.message || 'Unable to load service job details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const handleStartService = async () => {
    try {
      setIsUpdating(true);
      setSuccessMsg(null);
      setError(null);
      const response = await updateBookingStatus(id, 'IN_PROGRESS');

      if (response && response.success && response.data) {
        setBooking(response.data);
        setSuccessMsg('Service job started successfully (IN_PROGRESS).');
        setTimeout(() => setSuccessMsg(null), 4000);
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

  const handleCompleteService = async () => {
    try {
      setIsUpdating(true);
      setSuccessMsg(null);
      setError(null);
      const response = await updateBookingStatus(id, 'COMPLETED');

      if (response && response.success && response.data) {
        setBooking(response.data);
        setSuccessMsg('Service job completed successfully. Customer invoice generated.');
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchJobDetails();
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

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Loading service job & vehicle technical parameters...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Service Job Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error || 'Requested service job record does not exist or is not assigned to you.'}</p>
        <Link to="/mechanic/jobs" className="btn-card-primary" style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6', textDecoration: 'none' }}>
          Back to Assigned Jobs
        </Link>
      </div>
    );
  }

  const bId = booking._id || booking.id;
  const customer = booking.user || {};
  const vehicle = booking.vehicle || {};
  const service = booking.service || {};
  const center = booking.serviceCenter || {};

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

  const badge = getStatusBadge(booking.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* TOP HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/mechanic/jobs')}
            className="btn-card-secondary"
            style={{ padding: '0.4rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              Job #{bId.substring(bId.length - 6).toUpperCase()}
            </h1>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Scheduled for {formatDate(booking.bookingDate)} ({booking.bookingTime || 'N/A'})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="status-badge" style={{ backgroundColor: badge.bg, color: badge.color, fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
            {badge.label}
          </span>
          {booking.status === 'CONFIRMED' && (
            <button
              type="button"
              className="btn-card-primary"
              onClick={handleStartService}
              disabled={isUpdating}
              style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Play size={16} /> Start Service
            </button>
          )}
          {booking.status === 'IN_PROGRESS' && (
            <button
              type="button"
              className="btn-card-primary"
              onClick={handleCompleteService}
              disabled={isUpdating}
              style={{ backgroundColor: '#10B981', borderColor: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Check size={16} /> Complete Service
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="form-success-banner" role="status">
          <CheckCircle2 size={20} className="success-icon" />
          <div className="success-content">
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* SERVICE & VEHICLE GRID */}
      <div className="profile-grid">
        {/* SERVICE REQUIREMENTS */}
        <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} color="#3B82F6" />
            Service Requirements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Service Name</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary-dark)' }}>{service.name || 'N/A'}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.2rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Category</span>
                <span style={{ fontWeight: 600 }}>{service.category || 'General'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Estimated Duration</span>
                <span style={{ fontWeight: 600 }}>{service.duration ? `${service.duration} mins` : 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Service Price</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(service.price || booking.amount)}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Scheduled Time</span>
                <span style={{ fontWeight: 600 }}>{booking.bookingTime || 'N/A'}</span>
              </div>
            </div>

            {service.description && (
              <div style={{ marginTop: '0.4rem', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary-dark)', display: 'block', marginBottom: '0.2rem' }}>Service Description:</span>
                {service.description}
              </div>
            )}
          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={20} color="var(--primary-accent)" />
            Vehicle Technical Specifications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Make & Model</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary-dark)' }}>
                {vehicle.make} {vehicle.model}
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.2rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Registration Number</span>
                <span style={{ fontWeight: 700, color: '#3B82F6' }}>{vehicle.registrationNumber || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Year</span>
                <span style={{ fontWeight: 600 }}>{vehicle.year || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Fuel Type</span>
                <span style={{ fontWeight: 600 }}>{vehicle.fuelType || 'Petrol'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Color</span>
                <span style={{ fontWeight: 600 }}>{vehicle.color || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER & INVOICE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* CUSTOMER INFO */}
        <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="#10B981" />
            Customer Contact Info
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.92rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</span>
              <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--primary-dark)' }}>{customer.name || 'Customer'}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} color="var(--text-secondary)" />
              <span>{customer.phone || 'No phone provided'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} color="var(--text-secondary)" />
              <span>{customer.email || 'No email provided'}</span>
            </div>
          </div>
        </div>

        {/* WORKSHOP & INVOICE */}
        <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="#F59E0B" />
            Service Center & Billing
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.92rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Center Name</span>
              <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--primary-dark)' }}>{center.name || 'Workshop'}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <MapPin size={16} color="var(--text-secondary)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
              <span>{center.address || ''}{center.city ? `, ${center.city}` : ''}</span>
            </div>

            {booking.invoice && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Auto Invoice</span>
                  <strong style={{ display: 'block', color: '#8B5CF6' }}>{booking.invoice.invoiceNumber}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>Total: {formatCurrency(booking.invoice.total)}</span>
                </div>
                <button
                  type="button"
                  className="btn-card-primary"
                  onClick={() => handleDownloadPdf(booking.invoice._id || booking.invoice.id)}
                  disabled={downloadingInvoiceId === (booking.invoice._id || booking.invoice.id)}
                  style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {downloadingInvoiceId === (booking.invoice._id || booking.invoice.id) ? (
                    <Loader2 size={12} className="spinning-loader" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Download size={13} />
                  )}
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SPECIAL NOTES */}
      {booking.notes && (
        <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#8B5CF6" />
            Special Instructions & Notes
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, padding: '0.85rem', backgroundColor: 'var(--bg-light)', borderRadius: '10px' }}>
            {booking.notes}
          </p>
        </div>
      )}
    </div>
  );
}
