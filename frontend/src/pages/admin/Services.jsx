import { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Search,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Power,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Car,
} from 'lucide-react';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../../api/services.api';
import { formatCurrency } from '../../utils/formatters';

const SERVICE_CATEGORIES = [
  'General Service',
  'Periodic Maintenance',
  'Repair',
  'AC Service',
  'Engine',
  'Brakes',
  'Tyres',
  'Electrical',
  'Other',
];

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [viewingService, setViewingService] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    category: 'General Service',
    price: '',
    duration: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    category: 'General Service',
    price: '',
    duration: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [confirmStatusService, setConfirmStatusService] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [confirmDeleteService, setConfirmDeleteService] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Services (Admin passes includeInactive=true)
  const fetchServicesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getServices({ includeInactive: true });
      if (res && res.success) {
        setServices(res.data || []);
      } else {
        throw new Error(res?.message || 'Failed to fetch services catalog');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err.data?.message || err.message || 'Unable to load services catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicesData();
  }, [fetchServicesData]);

  // Client-side filtering
  const filteredServices = services.filter((s) => {
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const matchName = (s.name || '').toLowerCase().includes(term);
      const matchDesc = (s.description || '').toLowerCase().includes(term);
      if (!matchName && !matchDesc) return false;
    }
    if (categoryFilter && s.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== '') {
      const activeBool = statusFilter === 'true';
      if (s.isActive !== activeBool) return false;
    }
    return true;
  });

  const totalItems = filteredServices.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedServices = filteredServices.slice((page - 1) * limit, page * limit);

  // Summary Metrics
  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    inactive: services.filter((s) => !s.isActive).length,
    categories: new Set(services.map((s) => s.category)).size,
  };

  // View Service Handler
  const handleOpenViewModal = async (serviceId) => {
    try {
      setViewLoading(true);
      setViewingService(null);
      const res = await getServiceById(serviceId);
      if (res && res.success && res.data) {
        setViewingService(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch service details');
      }
    } catch (err) {
      console.error('Error viewing service:', err);
      alert(err.data?.message || err.message || 'Could not load service details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Add Service Handler
  const handleCreateServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      setAddError(null);

      const payload = {
        name: addFormData.name.trim(),
        description: addFormData.description ? addFormData.description.trim() : '',
        category: addFormData.category,
        price: parseFloat(addFormData.price),
        duration: parseInt(addFormData.duration, 10) || 0,
      };

      const res = await createService(payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Service "${res.data?.name || ''}" created successfully.` });
        setShowAddModal(false);
        setAddFormData({ name: '', description: '', category: 'General Service', price: '', duration: '' });
        fetchServicesData();
      } else {
        throw new Error(res?.message || 'Failed to create service');
      }
    } catch (err) {
      console.error('Error creating service:', err);
      setAddError(err.data?.message || err.message || 'Failed to create service.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Service Handler
  const handleOpenEditModal = (s) => {
    setEditingService(s);
    setEditFormData({
      name: s.name || '',
      description: s.description || '',
      category: s.category || 'General Service',
      price: s.price || '',
      duration: s.duration || '',
    });
    setEditError(null);
  };

  const handleUpdateServiceSubmit = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    const sId = editingService._id || editingService.id;

    try {
      setEditLoading(true);
      setEditError(null);

      const payload = {
        name: editFormData.name.trim(),
        description: editFormData.description ? editFormData.description.trim() : '',
        category: editFormData.category,
        price: parseFloat(editFormData.price),
        duration: parseInt(editFormData.duration, 10) || 0,
      };

      const res = await updateService(sId, payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Service "${res.data?.name || ''}" updated successfully.` });
        setEditingService(null);
        fetchServicesData();
      } else {
        throw new Error(res?.message || 'Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      setEditError(err.data?.message || err.message || 'Failed to update service.');
    } finally {
      setEditLoading(false);
    }
  };

  // Status Toggle Handler
  const handleToggleStatus = async () => {
    if (!confirmStatusService) return;
    const sId = confirmStatusService._id || confirmStatusService.id;
    const nextStatus = !confirmStatusService.isActive;

    try {
      setStatusLoading(true);
      const res = await updateService(sId, { isActive: nextStatus });
      if (res && res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Service "${confirmStatusService.name}" ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
        });
        setConfirmStatusService(null);
        fetchServicesData();
      } else {
        throw new Error(res?.message || 'Failed to update service status');
      }
    } catch (err) {
      console.error('Error updating service status:', err);
      alert(err.data?.message || err.message || 'Status update failed.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Delete Service Handler
  const handleDeleteService = async () => {
    if (!confirmDeleteService) return;
    const sId = confirmDeleteService._id || confirmDeleteService.id;

    try {
      setDeleteLoading(true);
      const res = await deleteService(sId);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Service "${confirmDeleteService.name}" deactivated/deleted successfully.` });
        setConfirmDeleteService(null);
        fetchServicesData();
      } else {
        throw new Error(res?.message || 'Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      alert(err.data?.message || err.message || 'Service deletion failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Wrench size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Service Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Manage your catalog of repair services, pricing, category classification, and availability.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-card-secondary"
            onClick={fetchServicesData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-card-primary"
            onClick={() => {
              setShowAddModal(true);
              setAddError(null);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
          >
            <Plus size={18} />
            <span>Add Service</span>
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
              placeholder="Search service name or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* CATEGORY FILTER */}
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div className="dashboard-stats-grid">
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Services</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{stats.total}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Services</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#10B981', marginTop: '0.2rem' }}>{stats.active}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Inactive Services</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#EF4444', marginTop: '0.2rem' }}>{stats.inactive}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categories Represented</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-accent)', marginTop: '0.2rem' }}>{stats.categories}</strong>
        </div>
      </div>

      {/* SERVICES TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading services catalog...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Services</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchServicesData}>
            Try Again
          </button>
        </div>
      ) : paginatedServices.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Wrench size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>No Services Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || categoryFilter || statusFilter ? 'No services match your current filter parameters.' : 'There are no services configured in the catalog.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-responsive-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedServices.map((s) => {
                  const sId = s._id || s.id;
                  return (
                    <tr key={sId}>
                      <td className="feature-name">
                        <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>{s.name}</strong>
                        {s.description && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal', display: 'block', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#2563EB' }}>
                          {s.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{formatCurrency(s.price)}</td>
                      <td>{s.duration ? `${s.duration} mins` : 'N/A'}</td>
                      <td>
                        <span className="status-badge" style={{ display: 'inline-flex' }}>
                          <span className="status-dot" style={{ backgroundColor: s.isActive ? '#10B981' : '#EF4444' }}></span>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button type="button" className="icon-button" title="View Service Details" onClick={() => handleOpenViewModal(sId)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="icon-button" title="Edit Service" onClick={() => handleOpenEditModal(s)}>
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title={s.isActive ? 'Deactivate Service' : 'Activate Service'}
                            onClick={() => setConfirmStatusService(s)}
                            style={{ color: s.isActive ? '#DC2626' : '#16A34A' }}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title="Delete Service"
                            onClick={() => setConfirmDeleteService(s)}
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
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total services)
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

      {/* VIEW SERVICE MODAL */}
      {(viewingService || viewLoading) && (
        <div className="modal-overlay" onClick={() => setViewingService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Service Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingService(null)}>
                <X size={20} />
              </button>
            </div>

            {viewLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewingService.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: 700 }}>{viewingService.category}</span>
                </div>

                <div className="car-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <strong>Price:</strong>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{formatCurrency(viewingService.price)}</div>
                  </div>
                  <div>
                    <strong>Duration:</strong>
                    <div>{viewingService.duration ? `${viewingService.duration} minutes` : 'Not specified'}</div>
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <div>{viewingService.isActive ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div>
                    <strong>Created:</strong>
                    <div>{new Date(viewingService.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  {viewingService.description && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Description:</strong>
                      <p style={{ marginTop: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        {viewingService.description}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button type="button" className="btn-card-secondary" onClick={() => setViewingService(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Service</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateServiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Service Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Full Synthetic Oil Change"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Category *</label>
                <select
                  className="form-control"
                  value={addFormData.category}
                  onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    required
                    placeholder="e.g. 2499"
                    value={addFormData.price}
                    onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Duration (mins)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 60"
                    value={addFormData.duration}
                    onChange={(e) => setAddFormData({ ...addFormData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Service inclusions, details, and specifications..."
                  value={addFormData.description}
                  onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={addLoading}>
                  {addLoading ? 'Creating...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SERVICE MODAL */}
      {editingService && (
        <div className="modal-overlay" onClick={() => setEditingService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Service</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditingService(null)}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateServiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Service Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Category *</label>
                <select
                  className="form-control"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    required
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Duration (mins)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setEditingService(null)}>
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

      {/* CONFIRM STATUS TOGGLE MODAL */}
      {confirmStatusService && (
        <div className="modal-overlay" onClick={() => setConfirmStatusService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {confirmStatusService.isActive ? 'Deactivate Service' : 'Activate Service'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmStatusService(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to {confirmStatusService.isActive ? 'deactivate' : 'activate'} service{' '}
              <strong>{confirmStatusService.name}</strong>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmStatusService(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{
                  backgroundColor: confirmStatusService.isActive ? '#DC2626' : '#16A34A',
                  borderColor: confirmStatusService.isActive ? '#DC2626' : '#16A34A',
                }}
                disabled={statusLoading}
                onClick={handleToggleStatus}
              >
                {statusLoading ? 'Updating...' : confirmStatusService.isActive ? 'Deactivate Service' : 'Activate Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteService && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#DC2626' }}>Delete / Deactivate Service</h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmDeleteService(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to remove service <strong>{confirmDeleteService.name}</strong> from active catalog?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmDeleteService(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                disabled={deleteLoading}
                onClick={handleDeleteService}
              >
                {deleteLoading ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
