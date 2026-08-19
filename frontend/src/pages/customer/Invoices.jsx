import { useState, useEffect } from 'react';
import { FileText, Eye, Download, X, Search, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { getInvoices, getInvoiceById, downloadInvoice } from '../../api/invoices.api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState('');

  const fetchCustomerInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInvoices();
      const rawData = response.data || response;
      const list = Array.isArray(rawData) ? rawData : [];
      setInvoices(list);
    } catch (err) {
      console.error('Error fetching invoices:', err.message);
      setError(err.data?.message || err.message || 'Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerInvoices();
  }, []);

  const handleViewInvoice = async (inv) => {
    const invId = inv._id || inv.id;
    try {
      setModalLoading(true);
      setSelectedInvoice(inv);
      const response = await getInvoiceById(invId);
      if (response && response.data) {
        setSelectedInvoice(response.data);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownload = async (invoiceObj) => {
    if (!invoiceObj) return;
    const invId = invoiceObj._id || invoiceObj.id;
    const invNum = invoiceObj.invoiceNumber || invId;

    setDownloadingId(invId);
    setDownloadNotice('');

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
      setDownloadNotice(`Invoice ${invNum} downloaded successfully.`);
      setTimeout(() => setDownloadNotice(''), 4000);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setDownloadNotice(err.message || 'Failed to download invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const invNum = inv.invoiceNumber || inv._id || '';
    const vName = inv.vehicle ? `${inv.vehicle.make || ''} ${inv.vehicle.model || ''}`.trim() : '';
    const serviceNames = inv.items ? inv.items.map((i) => i.serviceName).join(' ') : '';

    const matchesSearch =
      !searchTerm.trim() ||
      invNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceNames.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || inv.paymentStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
          My Invoices
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          View and download billing invoices for your completed services.
        </p>
      </div>

      {downloadNotice && (
        <div className="pricing-alert-box" style={{ padding: '1rem 1.25rem' }}>
          <FileText size={20} className="alert-icon" />
          <div className="alert-text">
            <p>{downloadNotice}</p>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="search-filter-card">
        <div className="search-filter-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="input-with-icon">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by invoice #, vehicle, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="category-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading invoices...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Failed to Load Invoices</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchCustomerInvoices}>
            Try Again
          </button>
        </div>
      ) : (
        /* INVOICES TABLE */
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Vehicle</th>
                <th>Service Delivered</th>
                <th>Date Issued</th>
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const invId = inv._id || inv.id;
                  const invNum = inv.invoiceNumber || invId.slice(-8).toUpperCase();
                  const vName = inv.vehicle ? `${inv.vehicle.make || ''} ${inv.vehicle.model || ''}`.trim() : 'Vehicle';
                  const regNum = inv.vehicle?.registrationNumber || '';
                  const serviceTitle = inv.items && inv.items.length > 0
                    ? inv.items.map((i) => i.serviceName).join(', ')
                    : 'Service';
                  const issueDate = new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={invId}>
                      <td style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{invNum}</td>
                      <td>
                        {vName}
                        {regNum && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {regNum}
                          </span>
                        )}
                      </td>
                      <td>{serviceTitle}</td>
                      <td>{issueDate}</td>
                      <td style={{ fontWeight: '800' }}>₹{inv.total}</td>
                      <td>
                        <span className="status-badge" style={{ display: 'inline-flex' }}>
                          <span className="status-dot"></span>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-card-secondary"
                            onClick={() => handleViewInvoice(inv)}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                          >
                            <Eye size={14} style={{ marginRight: '0.2rem' }} /> View
                          </button>
                          <button
                            type="button"
                            className="btn-card-secondary"
                            onClick={() => handleDownload(inv)}
                            disabled={downloadingId === invId}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                          >
                            {downloadingId === invId ? (
                              <>
                                <Loader2 size={14} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', marginRight: '0.2rem' }} /> Downloading...
                              </>
                            ) : (
                              <>
                                <Download size={14} style={{ marginRight: '0.2rem' }} /> Download
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No billing invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* INVOICE PREVIEW MODAL */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Invoice Details ({selectedInvoice.invoiceNumber || selectedInvoice._id})
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedInvoice(null)}>
                <X size={20} />
              </button>
            </div>

            {modalLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader2 size={28} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-light)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Billed To:</span>
                  <strong>{selectedInvoice.user?.name || 'Customer'} ({selectedInvoice.user?.phone || selectedInvoice.user?.email || 'N/A'})</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Vehicle:</span>
                  <strong>
                    {selectedInvoice.vehicle
                      ? `${selectedInvoice.vehicle.make || ''} ${selectedInvoice.vehicle.model || ''} (${selectedInvoice.vehicle.registrationNumber || ''})`
                      : 'Vehicle'}
                  </strong>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Line Items:</span>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                        <span>{item.serviceName} (x{item.quantity})</span>
                        <strong>₹{item.amount}</strong>
                      </div>
                    ))
                  ) : (
                    <span>Service item</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                  <strong>₹{selectedInvoice.subtotal}</strong>
                </div>

                {selectedInvoice.tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tax:</span>
                    <strong>₹{selectedInvoice.tax}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Total Amount:</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--primary-accent)' }}>₹{selectedInvoice.total}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment Method / Status:</span>
                  <span className="status-badge" style={{ display: 'inline-flex' }}>
                    <span className="status-dot"></span>
                    {selectedInvoice.paymentMethod || 'CASH'} – {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn-card-primary"
                onClick={() => handleDownload(selectedInvoice)}
                disabled={downloadingId === (selectedInvoice._id || selectedInvoice.id)}
              >
                {downloadingId === (selectedInvoice._id || selectedInvoice.id) ? (
                  <>
                    <Loader2 size={16} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', marginRight: '0.3rem' }} /> Downloading...
                  </>
                ) : (
                  <>
                    <Download size={16} style={{ marginRight: '0.3rem' }} /> Download Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
