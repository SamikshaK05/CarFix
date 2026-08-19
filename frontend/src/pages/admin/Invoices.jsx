import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Eye,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  CreditCard,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Car,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updatePaymentStatus,
} from '../../api/invoices.api';
import { getBookings } from '../../api/bookings.api';
import { formatCurrency } from '../../utils/formatters';

const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'RAZORPAY', 'OTHER'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    bookingId: '',
    taxRate: '18',
    paymentMethod: 'CASH',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [updatingStatusInvoice, setUpdatingStatusInvoice] = useState(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const [editingMethodInvoice, setEditingMethodInvoice] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [methodLoading, setMethodLoading] = useState(false);

  // Fetch Invoices & Completed Bookings
  const fetchInvoicesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [invoicesRes, bookingsRes] = await Promise.all([
        getInvoices(),
        getBookings().catch(() => null),
      ]);

      if (invoicesRes && invoicesRes.success) {
        setInvoices(invoicesRes.data || []);
      } else {
        throw new Error(invoicesRes?.message || 'Failed to fetch invoices list');
      }

      if (bookingsRes && bookingsRes.success && Array.isArray(bookingsRes.data)) {
        // Filter bookings with COMPLETED status for create invoice dropdown
        const completed = bookingsRes.data.filter((b) => b.status === 'COMPLETED');
        setCompletedBookings(completed);
      }
    } catch (err) {
      console.error('Error fetching admin invoices data:', err);
      setError(err.data?.message || err.message || 'Unable to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoicesData();
  }, [fetchInvoicesData]);

  // Client-side multi-field searching and filtering
  const filteredInvoices = invoices.filter((inv) => {
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const numMatch = (inv.invoiceNumber || '').toLowerCase().includes(term);
      const custName = (inv.user?.name || '').toLowerCase().includes(term);
      const custEmail = (inv.user?.email || '').toLowerCase().includes(term);
      const custPhone = (inv.user?.phone || '').toLowerCase().includes(term);
      const vehMake = (inv.vehicle?.make || '').toLowerCase().includes(term);
      const vehModel = (inv.vehicle?.model || '').toLowerCase().includes(term);
      const regNum = (inv.vehicle?.registrationNumber || '').toLowerCase().includes(term);

      if (!numMatch && !custName && !custEmail && !custPhone && !vehMake && !vehModel && !regNum) {
        return false;
      }
    }

    if (statusFilter && inv.paymentStatus !== statusFilter) {
      return false;
    }

    if (methodFilter && inv.paymentMethod !== methodFilter) {
      return false;
    }

    return true;
  });

  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedInvoices = filteredInvoices.slice((page - 1) * limit, page * limit);

  // Calculate Summary Metrics
  const paidInvoicesList = invoices.filter((i) => i.paymentStatus === 'PAID');
  const totalRevenue = paidInvoicesList.reduce((sum, i) => sum + (i.total || 0), 0);

  const stats = {
    totalCount: invoices.length,
    pendingCount: invoices.filter((i) => i.paymentStatus === 'PENDING').length,
    paidCount: paidInvoicesList.length,
    failedCount: invoices.filter((i) => i.paymentStatus === 'FAILED').length,
    refundedCount: invoices.filter((i) => i.paymentStatus === 'REFUNDED').length,
    totalRevenue: formatCurrency(totalRevenue),
  };

  // View Invoice Detail Modal Handler
  const handleOpenViewModal = async (invoiceId) => {
    try {
      setViewLoading(true);
      setViewingInvoice(null);
      const res = await getInvoiceById(invoiceId);
      if (res && res.success && res.data) {
        setViewingInvoice(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch invoice details');
      }
    } catch (err) {
      console.error('Error viewing invoice details:', err);
      alert(err.data?.message || err.message || 'Could not load invoice details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Create Invoice Submission Handler
  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!createFormData.bookingId) {
      setCreateError('Please select a completed booking to bill.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const payload = {
        booking: createFormData.bookingId,
        tax: parseFloat(createFormData.taxRate) || 0,
        paymentMethod: createFormData.paymentMethod,
      };

      const res = await createInvoice(payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Invoice ${res.data?.invoiceNumber || ''} created successfully.` });
        setShowCreateModal(false);
        setCreateFormData({ bookingId: '', taxRate: '18', paymentMethod: 'CASH' });
        fetchInvoicesData();
      } else {
        throw new Error(res?.message || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setCreateError(err.data?.message || err.message || 'Failed to create invoice.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Update Payment Status Handler
  const handleSavePaymentStatus = async (e) => {
    e.preventDefault();
    if (!updatingStatusInvoice || !selectedPaymentStatus) return;
    const invId = updatingStatusInvoice._id || updatingStatusInvoice.id;

    try {
      setStatusLoading(true);
      const res = await updatePaymentStatus(invId, selectedPaymentStatus);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Payment status for ${updatingStatusInvoice.invoiceNumber} updated to ${selectedPaymentStatus}.` });
        setUpdatingStatusInvoice(null);
        fetchInvoicesData();
      } else {
        throw new Error(res?.message || 'Failed to update payment status');
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert(err.data?.message || err.message || 'Payment status update failed.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Edit Payment Method Handler
  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    if (!editingMethodInvoice || !selectedPaymentMethod) return;
    const invId = editingMethodInvoice._id || editingMethodInvoice.id;

    try {
      setMethodLoading(true);
      const res = await updateInvoice(invId, { paymentMethod: selectedPaymentMethod });
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Payment method for ${editingMethodInvoice.invoiceNumber} updated to ${selectedPaymentMethod}.` });
        setEditingMethodInvoice(null);
        fetchInvoicesData();
      } else {
        throw new Error(res?.message || 'Failed to update payment method');
      }
    } catch (err) {
      console.error('Error updating payment method:', err);
      alert(err.data?.message || err.message || 'Payment method update failed.');
    } finally {
      setMethodLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'PAID':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', text: 'PAID' };
      case 'FAILED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#DC2626', text: 'FAILED' };
      case 'REFUNDED':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#7C3AED', text: 'REFUNDED' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706', text: 'PENDING' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Invoice Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Monitor billing, payment transactions, invoice generation, and revenue collection.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-card-secondary"
            onClick={fetchInvoicesData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-card-primary"
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
          >
            <Plus size={18} />
            <span>Create Invoice</span>
          </button>
        </div>
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
              placeholder="Search invoice #, customer, or vehicle..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* PAYMENT STATUS FILTER */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* PAYMENT METHOD FILTER */}
          <select
            className="form-control"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div className="dashboard-stats-grid">
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Invoices</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{stats.totalCount}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Payments</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#D97706', marginTop: '0.2rem' }}>{stats.pendingCount}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Paid Invoices</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#059669', marginTop: '0.2rem' }}>{stats.paidCount}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Collected Revenue</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-accent)', marginTop: '0.2rem' }}>
            {stats.totalRevenue}
          </strong>
        </div>
      </div>

      {/* INVOICES TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading invoices...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Invoices</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchInvoicesData}>
            Try Again
          </button>
        </div>
      ) : paginatedInvoices.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <FileText size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>No Invoices Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || statusFilter || methodFilter ? 'No invoices match your filter criteria.' : 'There are currently no invoices issued.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-responsive-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Issued Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv) => {
                  const invId = inv._id || inv.id;
                  const customerName = inv.user?.name || 'Customer';
                  const customerContact = inv.user?.phone || inv.user?.email || '';
                  const vehTitle = inv.vehicle ? `${inv.vehicle.make || ''} ${inv.vehicle.model || ''}`.trim() : 'Vehicle';
                  const regNum = inv.vehicle?.registrationNumber || '';
                  const badge = getStatusBadgeStyle(inv.paymentStatus);
                  const dateStr = inv.issuedAt || inv.createdAt
                    ? new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={invId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-accent)', fontSize: '0.88rem' }}>
                        {inv.invoiceNumber}
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
                      <td>{formatCurrency(inv.subtotal)}</td>
                      <td>{formatCurrency(inv.tax)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{formatCurrency(inv.total)}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#2563EB' }}>
                          {inv.paymentMethod || 'CASH'}
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
                      <td>{dateStr}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          {/* VIEW PREVIEW BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="View Invoice Details"
                            onClick={() => handleOpenViewModal(invId)}
                          >
                            <Eye size={16} />
                          </button>

                          {/* UPDATE STATUS BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Update Payment Status"
                            onClick={() => {
                              setUpdatingStatusInvoice(inv);
                              setSelectedPaymentStatus(inv.paymentStatus);
                            }}
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          {/* EDIT PAYMENT METHOD BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit Payment Method"
                            onClick={() => {
                              setEditingMethodInvoice(inv);
                              setSelectedPaymentMethod(inv.paymentMethod || 'CASH');
                            }}
                            style={{ color: '#2563EB' }}
                          >
                            <CreditCard size={16} />
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
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} matching invoices)
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

      {/* VIEW INVOICE PREVIEW MODAL */}
      {(viewingInvoice || viewLoading) && (
        <div className="modal-overlay" onClick={() => setViewingInvoice(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Invoice Preview</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingInvoice(null)}>
                <X size={20} />
              </button>
            </div>

            {viewLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invoice Number</span>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
                      {viewingInvoice.invoiceNumber}
                    </h4>
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: getStatusBadgeStyle(viewingInvoice.paymentStatus).bg,
                      color: getStatusBadgeStyle(viewingInvoice.paymentStatus).color,
                    }}
                  >
                    {viewingInvoice.paymentStatus}
                  </span>
                </div>

                <div className="car-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <strong>Customer:</strong>
                    <div style={{ marginTop: '0.2rem' }}>{viewingInvoice.user?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingInvoice.user?.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingInvoice.user?.phone}</div>
                  </div>

                  <div>
                    <strong>Vehicle:</strong>
                    <div style={{ marginTop: '0.2rem' }}>
                      {viewingInvoice.vehicle?.make} {viewingInvoice.vehicle?.model}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Reg: {viewingInvoice.vehicle?.registrationNumber}
                    </div>
                  </div>

                  <div>
                    <strong>Payment Method:</strong>
                    <div style={{ marginTop: '0.2rem', fontWeight: 600 }}>{viewingInvoice.paymentMethod || 'CASH'}</div>
                  </div>

                  <div>
                    <strong>Issued Date:</strong>
                    <div style={{ marginTop: '0.2rem' }}>
                      {new Date(viewingInvoice.issuedAt || viewingInvoice.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* LINE ITEMS TABLE */}
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.92rem' }}>Billed Line Items</strong>
                  <table className="comparison-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(viewingInvoice.items) && viewingInvoice.items.length > 0 ? (
                        viewingInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.serviceName}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No line items recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* BILLING BREAKDOWN */}
                <div style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <strong>{formatCurrency(viewingInvoice.subtotal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax Amount:</span>
                    <strong>{formatCurrency(viewingInvoice.tax)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: 'var(--primary-accent)' }}>{formatCurrency(viewingInvoice.total)}</span>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                  <button type="button" className="btn-card-secondary" onClick={() => setViewingInvoice(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Invoice</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  Select Completed Booking *
                </label>
                {completedBookings.length > 0 ? (
                  <select
                    className="form-control"
                    required
                    value={createFormData.bookingId}
                    onChange={(e) => setCreateFormData({ ...createFormData, bookingId: e.target.value })}
                  >
                    <option value="">-- Choose Completed Booking --</option>
                    {completedBookings.map((b) => {
                      const bId = b._id || b.id;
                      const cName = b.user?.name || 'Customer';
                      const sName = b.service?.name || 'Service';
                      const price = b.service?.price || b.amount || 0;
                      return (
                        <option key={bId} value={bId}>
                          #{bId.substring(bId.length - 6).toUpperCase()} - {cName} ({sName} - {formatCurrency(price)})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    No completed bookings available to bill. Complete a booking appointment first.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Tax Rate (%) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="form-control"
                    required
                    placeholder="e.g. 18"
                    value={createFormData.taxRate}
                    onChange={(e) => setCreateFormData({ ...createFormData, taxRate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Payment Method *</label>
                  <select
                    className="form-control"
                    value={createFormData.paymentMethod}
                    onChange={(e) => setCreateFormData({ ...createFormData, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-card-primary"
                  disabled={createLoading || completedBookings.length === 0}
                >
                  {createLoading ? 'Generating Invoice...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PAYMENT STATUS MODAL */}
      {updatingStatusInvoice && (
        <div className="modal-overlay" onClick={() => setUpdatingStatusInvoice(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Update Payment Status</h3>
              <button type="button" className="modal-close-btn" onClick={() => setUpdatingStatusInvoice(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePaymentStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Invoice</span>
                <div style={{ fontWeight: 700, color: 'var(--primary-accent)', fontSize: '1rem' }}>
                  {updatingStatusInvoice.invoiceNumber}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Payment Status *</label>
                <select
                  className="form-control"
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  required
                >
                  {PAYMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setUpdatingStatusInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={statusLoading}>
                  {statusLoading ? 'Saving...' : 'Save Payment Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYMENT METHOD MODAL */}
      {editingMethodInvoice && (
        <div className="modal-overlay" onClick={() => setEditingMethodInvoice(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Payment Method</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditingMethodInvoice(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Invoice</span>
                <div style={{ fontWeight: 700, color: 'var(--primary-accent)', fontSize: '1rem' }}>
                  {editingMethodInvoice.invoiceNumber}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Payment Method *</label>
                <select
                  className="form-control"
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  required
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setEditingMethodInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={methodLoading}>
                  {methodLoading ? 'Saving...' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
