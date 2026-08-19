import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Phone,
  Mail,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Building,
} from 'lucide-react';
import {
  getServiceCenters,
  createServiceCenter,
  updateServiceCenter,
} from '../../api/serviceCenters.api';

export default function ServiceManagerServiceCenter() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingCenter, setEditingCenter] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    openingHours: 'Mon - Sat: 8:00 AM - 7:00 PM',
  });

  const fetchCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServiceCenters();
      if (response && response.success && Array.isArray(response.data)) {
        setCenters(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch service centers');
      }
    } catch (err) {
      console.error('Error loading service centers:', err.message);
      setError(err.data?.message || err.message || 'Unable to load service centers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      openingHours: 'Mon - Sat: 8:00 AM - 7:00 PM',
    });
    setModalError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (sc) => {
    setEditingCenter(sc);
    setFormData({
      name: sc.name || '',
      address: sc.address || '',
      city: sc.city || '',
      state: sc.state || '',
      pincode: sc.pincode || '',
      phone: sc.phone || '',
      email: sc.email || '',
      openingHours: sc.openingHours || 'Mon - Sat: 8:00 AM - 7:00 PM',
    });
    setModalError(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.phone.trim()) {
      setModalError('Name, Address, City, and Phone are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        openingHours: formData.openingHours.trim() || undefined,
        isActive: true,
      };

      const response = await createServiceCenter(payload);
      if (response && response.success) {
        setSuccessMsg(`Service Center "${formData.name}" created successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setIsCreateModalOpen(false);
        fetchCenters();
      } else {
        throw new Error(response?.message || 'Failed to create service center');
      }
    } catch (err) {
      console.error('Error creating center:', err.message);
      setModalError(err.data?.message || err.message || 'Failed to create service center.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCenter) return;

    try {
      setIsSubmitting(true);
      setModalError(null);
      const scId = editingCenter._id || editingCenter.id;
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        openingHours: formData.openingHours.trim() || undefined,
      };

      const response = await updateServiceCenter(scId, payload);
      if (response && response.success) {
        setSuccessMsg('Service Center details updated successfully.');
        setTimeout(() => setSuccessMsg(null), 4000);
        setEditingCenter(null);
        fetchCenters();
      } else {
        throw new Error(response?.message || 'Failed to update service center');
      }
    } catch (err) {
      console.error('Error updating center:', err.message);
      setModalError(err.data?.message || err.message || 'Failed to update service center.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCenters = useMemo(() => {
    return centers.filter((sc) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        sc.name.toLowerCase().includes(term) ||
        sc.city.toLowerCase().includes(term) ||
        (sc.phone && sc.phone.toLowerCase().includes(term)) ||
        (sc.address && sc.address.toLowerCase().includes(term))
      );
    });
  }, [centers, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
            Service Centers Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Manage service center locations, contact details, operational hours, and ratings.
          </p>
        </div>
        <button
          type="button"
          className="btn-card-primary"
          onClick={handleOpenCreateModal}
          style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={18} /> Register Service Center
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

      {/* SEARCH BAR */}
      <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: '1', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search center by name, city, address, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* SERVICE CENTERS GRID */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#8B5CF6' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading service center locations...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Service Centers</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchCenters} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
            Try Again
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredCenters.length > 0 ? (
            filteredCenters.map((sc) => {
              const scId = sc._id || sc.id;
              return (
                <div key={scId} style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.15rem', color: 'var(--primary-dark)' }}>{sc.name}</strong>
                      <span className="status-badge" style={{ backgroundColor: sc.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: sc.isActive ? '#10B981' : '#EF4444', fontSize: '0.75rem', display: 'inline-flex' }}>
                        {sc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                      <MapPin size={16} color="#8B5CF6" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                      <span>{sc.address}, {sc.city}{sc.state ? `, ${sc.state}` : ''} {sc.pincode || ''}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} color="var(--text-secondary)" />
                        <span>{sc.phone || 'N/A'}</span>
                      </div>

                      {sc.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mail size={14} color="var(--text-secondary)" />
                          <span>{sc.email}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} color="var(--text-secondary)" />
                        <span>{sc.openingHours || 'Mon - Sat: 8 AM - 7 PM'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem' }}>
                      <Star size={16} fill="#F59E0B" /> {sc.rating || 0} ({sc.totalReviews || 0} reviews)
                    </div>

                    <button
                      type="button"
                      className="btn-card-secondary"
                      onClick={() => handleOpenEditModal(sc)}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Edit2 size={14} /> Edit Center
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              No service centers found.
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(isCreateModalOpen || editingCenter) && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={20} color="#8B5CF6" />
                {editingCenter ? 'Edit Service Center Details' : 'Register Service Center'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => { setIsCreateModalOpen(false); setEditingCenter(null); }}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={editingCenter ? handleEditSubmit : handleCreateSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Center Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. CarFix Main Workshop"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Street Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Plot 42, Industrial Estate"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>City *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Pune"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Pincode</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="e.g. 411001"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Contact Phone *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. center@carfix.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Opening Hours</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                    placeholder="e.g. Mon - Sat: 8:00 AM - 7:00 PM"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => { setIsCreateModalOpen(false); setEditingCenter(null); }} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={isSubmitting} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
                  {isSubmitting ? 'Saving...' : editingCenter ? 'Save Changes' : 'Register Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
