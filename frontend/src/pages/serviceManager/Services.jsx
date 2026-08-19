import { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  X,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react';
import { getServices, createService, updateService, deleteService } from '../../api/services.api';
import { formatCurrency } from '../../utils/formatters';

export default function ServiceManagerServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [viewingService, setViewingService] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General Service',
    price: '',
    duration: '60',
    image: '',
  });

  const fetchServicesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServices({ includeInactive: 'true' });
      if (response && response.success && Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch services catalog');
      }
    } catch (err) {
      console.error('Error loading services:', err.message);
      setError(err.data?.message || err.message || 'Unable to load services catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'General Service',
      price: '',
      duration: '60',
      image: '',
    });
    setModalError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (srv) => {
    setEditingService(srv);
    setFormData({
      name: srv.name || '',
      description: srv.description || '',
      category: srv.category || 'General Service',
      price: srv.price !== undefined ? String(srv.price) : '',
      duration: srv.duration !== undefined ? String(srv.duration) : '60',
      image: srv.image || '',
    });
    setModalError(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      setModalError('Service Name and Price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: Number(formData.price),
        duration: Number(formData.duration) || 60,
        image: formData.image.trim() || null,
      };

      const response = await createService(payload);
      if (response && response.success) {
        setSuccessMsg(`Service "${formData.name}" created successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setIsCreateModalOpen(false);
        fetchServicesData();
      } else {
        throw new Error(response?.message || 'Failed to create service');
      }
    } catch (err) {
      console.error('Error creating service:', err.message);
      setModalError(err.data?.message || err.message || 'Failed to create service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      setIsSubmitting(true);
      setModalError(null);
      const sId = editingService._id || editingService.id;
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: Number(formData.price),
        duration: Number(formData.duration) || 60,
        image: formData.image.trim() || null,
      };

      const response = await updateService(sId, payload);
      if (response && response.success) {
        setSuccessMsg(`Service updated successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setEditingService(null);
        fetchServicesData();
      } else {
        throw new Error(response?.message || 'Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err.message);
      setModalError(err.data?.message || err.message || 'Failed to update service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (srv) => {
    try {
      const sId = srv._id || srv.id;
      const newStatus = !srv.isActive;
      const response = await updateService(sId, { isActive: newStatus });
      if (response && response.success) {
        setSuccessMsg(`Service status set to ${newStatus ? 'Active' : 'Inactive'}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchServicesData();
      }
    } catch (err) {
      console.error('Error toggling status:', err.message);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.isActive) ||
        (statusFilter === 'INACTIVE' && !s.isActive);

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        (s.category && s.category.toLowerCase().includes(term)) ||
        (s.description && s.description.toLowerCase().includes(term));

      return matchStatus && matchSearch;
    });
  }, [services, searchTerm, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
            Services Catalog Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            View, create, edit, and toggle available maintenance & repair services.
          </p>
        </div>
        <button
          type="button"
          className="btn-card-primary"
          onClick={handleOpenCreateModal}
          style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={18} /> Add New Service
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
      <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search service by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: statusFilter === st ? '#8B5CF6' : 'var(--border-color)',
                backgroundColor: statusFilter === st ? '#8B5CF6' : 'var(--white)',
                color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {st === 'ALL' ? 'All Services' : st}
            </button>
          ))}
        </div>
      </div>

      {/* SERVICES TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#8B5CF6' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading services catalog...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Services</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchServicesData} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Est. Duration</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length > 0 ? (
                filteredServices.map((s) => {
                  const sId = s._id || s.id;
                  return (
                    <tr key={sId}>
                      <td className="feature-name">
                        <strong style={{ color: 'var(--primary-dark)' }}>{s.name}</strong>
                        {s.description && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {s.description.length > 60 ? `${s.description.substring(0, 60)}...` : s.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', backgroundColor: 'var(--bg-light)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                          {s.category || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                        {formatCurrency(s.price)}
                      </td>
                      <td>{s.duration ? `${s.duration} mins` : 'N/A'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title="Click to toggle status"
                        >
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: s.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: s.isActive ? '#10B981' : '#EF4444',
                              display: 'inline-flex',
                            }}
                          >
                            <span className="status-dot"></span>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn-card-secondary"
                            onClick={() => setViewingService(s)}
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="View Service Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-card-secondary"
                            onClick={() => handleOpenEditModal(s)}
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="Edit Service"
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    No services found matching current search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW SERVICE MODAL */}
      {viewingService && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="#8B5CF6" />
                Service Information
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingService(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Service Title</span>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--primary-dark)', margin: 0 }}>{viewingService.name}</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--bg-light)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Category</span>
                  <strong>{viewingService.category || 'General'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Price</span>
                  <strong style={{ color: '#10B981' }}>{formatCurrency(viewingService.price)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Est. Duration</span>
                  <strong>{viewingService.duration ? `${viewingService.duration} mins` : 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Status</span>
                  <strong style={{ color: viewingService.isActive ? '#10B981' : '#EF4444' }}>
                    {viewingService.isActive ? 'Active' : 'Inactive'}
                  </strong>
                </div>
              </div>

              {viewingService.description && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Description:</span>
                  <p style={{ marginTop: '0.2rem', fontSize: '0.9rem', color: 'var(--primary-dark)', lineHeight: '1.5' }}>
                    {viewingService.description}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setViewingService(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SERVICE MODAL */}
      {(isCreateModalOpen || editingService) && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="#8B5CF6" />
                {editingService ? 'Edit Service Details' : 'Create New Service'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingService(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={editingService ? handleEditSubmit : handleCreateSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Service Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Full Synthetic Oil Change"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Category *</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="General Service">General Service</option>
                      <option value="Oil & Fluid Service">Oil & Fluid Service</option>
                      <option value="Brake Service">Brake Service</option>
                      <option value="Engine Repair">Engine Repair</option>
                      <option value="AC & Heating">AC & Heating</option>
                      <option value="Tire & Alignment">Tire & Alignment</option>
                      <option value="Battery & Electrical">Battery & Electrical</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Price (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 2499"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Est. Duration (Minutes) *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 60"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide overview of what this service covers..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-card-secondary"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingService(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-card-primary"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', marginRight: '0.3rem' }} /> Saving...
                    </>
                  ) : editingService ? (
                    'Save Changes'
                  ) : (
                    'Create Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
