import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
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
  Star,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Building,
} from 'lucide-react';
import {
  getServiceCenters,
  getServiceCenterById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
} from '../../api/serviceCenters.api';
import { getServices } from '../../api/services.api';

export default function AdminServiceCenters() {
  const [centers, setCenters] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [viewingCenter, setViewingCenter] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    openingHours: '9:00 AM - 7:00 PM',
    selectedServiceIds: [],
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  const [editingCenter, setEditingCenter] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    openingHours: '',
    selectedServiceIds: [],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [confirmStatusCenter, setConfirmStatusCenter] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [confirmDeleteCenter, setConfirmDeleteCenter] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Service Centers (Admin passes includeInactive=true) & Available Services
  const fetchCentersData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [centersRes, servicesRes] = await Promise.all([
        getServiceCenters({ includeInactive: true }),
        getServices({ includeInactive: false }).catch(() => null),
      ]);

      if (centersRes && centersRes.success) {
        setCenters(centersRes.data || []);
      } else {
        throw new Error(centersRes?.message || 'Failed to fetch service centers list');
      }

      if (servicesRes && servicesRes.success && servicesRes.data) {
        setAvailableServices(servicesRes.data);
      }
    } catch (err) {
      console.error('Error fetching service centers:', err);
      setError(err.data?.message || err.message || 'Unable to load service centers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCentersData();
  }, [fetchCentersData]);

  // Derive unique cities list for filter dropdown
  const uniqueCities = Array.from(new Set(centers.map((c) => c.city).filter(Boolean))).sort();

  // Client-side filtering
  const filteredCenters = centers.filter((c) => {
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const matchName = (c.name || '').toLowerCase().includes(term);
      const matchAddr = (c.address || '').toLowerCase().includes(term);
      const matchCity = (c.city || '').toLowerCase().includes(term);
      const matchState = (c.state || '').toLowerCase().includes(term);
      const matchPhone = (c.phone || '').toLowerCase().includes(term);
      if (!matchName && !matchAddr && !matchCity && !matchState && !matchPhone) return false;
    }

    if (cityFilter && (c.city || '').toLowerCase() !== cityFilter.toLowerCase()) {
      return false;
    }

    if (statusFilter !== '') {
      const activeBool = statusFilter === 'true';
      if (c.isActive !== activeBool) return false;
    }

    return true;
  });

  const totalItems = filteredCenters.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedCenters = filteredCenters.slice((page - 1) * limit, page * limit);

  // Summary Metrics Calculation
  const totalRatingSum = centers.reduce((sum, c) => sum + (c.rating || 0), 0);
  const avgRating = centers.length > 0 ? (totalRatingSum / centers.length).toFixed(1) : '0.0';

  const stats = {
    total: centers.length,
    active: centers.filter((c) => c.isActive).length,
    inactive: centers.filter((c) => !c.isActive).length,
    avgRating,
  };

  // View Details Modal Handler
  const handleOpenViewModal = async (centerId) => {
    try {
      setViewLoading(true);
      setViewingCenter(null);
      const res = await getServiceCenterById(centerId);
      if (res && res.success && res.data) {
        setViewingCenter(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch center details');
      }
    } catch (err) {
      console.error('Error viewing center details:', err);
      alert(err.data?.message || err.message || 'Could not load service center details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Add Center Form Submission Handler
  const handleCreateCenterSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      setAddError(null);

      const payload = {
        name: addFormData.name.trim(),
        description: addFormData.description ? addFormData.description.trim() : null,
        address: addFormData.address.trim(),
        city: addFormData.city.trim(),
        state: addFormData.state ? addFormData.state.trim() : null,
        pincode: addFormData.pincode ? addFormData.pincode.trim() : null,
        phone: addFormData.phone.trim(),
        email: addFormData.email ? addFormData.email.trim().toLowerCase() : null,
        openingHours: addFormData.openingHours ? addFormData.openingHours.trim() : null,
        services: addFormData.selectedServiceIds,
      };

      const res = await createServiceCenter(payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Service center "${res.data?.name || ''}" created successfully.` });
        setShowAddModal(false);
        setAddFormData({
          name: '',
          description: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          phone: '',
          email: '',
          openingHours: '9:00 AM - 7:00 PM',
          selectedServiceIds: [],
        });
        fetchCentersData();
      } else {
        throw new Error(res?.message || 'Failed to create service center');
      }
    } catch (err) {
      console.error('Error creating service center:', err);
      setAddError(err.data?.message || err.message || 'Failed to create service center.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Center Form Modal Open & Submission Handlers
  const handleOpenEditModal = (c) => {
    setEditingCenter(c);
    const existingServiceIds = Array.isArray(c.services)
      ? c.services.map((s) => (typeof s === 'object' ? s._id || s.id : s))
      : [];

    setEditFormData({
      name: c.name || '',
      description: c.description || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || '',
      phone: c.phone || '',
      email: c.email || '',
      openingHours: c.openingHours || '',
      selectedServiceIds: existingServiceIds,
    });
    setEditError(null);
  };

  const handleUpdateCenterSubmit = async (e) => {
    e.preventDefault();
    if (!editingCenter) return;
    const cId = editingCenter._id || editingCenter.id;

    try {
      setEditLoading(true);
      setEditError(null);

      const payload = {
        name: editFormData.name.trim(),
        description: editFormData.description ? editFormData.description.trim() : null,
        address: editFormData.address.trim(),
        city: editFormData.city.trim(),
        state: editFormData.state ? editFormData.state.trim() : null,
        pincode: editFormData.pincode ? editFormData.pincode.trim() : null,
        phone: editFormData.phone.trim(),
        email: editFormData.email ? editFormData.email.trim().toLowerCase() : null,
        openingHours: editFormData.openingHours ? editFormData.openingHours.trim() : null,
        services: editFormData.selectedServiceIds,
      };

      const res = await updateServiceCenter(cId, payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Service center "${res.data?.name || ''}" updated successfully.` });
        setEditingCenter(null);
        fetchCentersData();
      } else {
        throw new Error(res?.message || 'Failed to update service center');
      }
    } catch (err) {
      console.error('Error updating service center:', err);
      setEditError(err.data?.message || err.message || 'Failed to update service center.');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle Status Handler
  const handleToggleStatus = async () => {
    if (!confirmStatusCenter) return;
    const cId = confirmStatusCenter._id || confirmStatusCenter.id;
    const nextStatus = !confirmStatusCenter.isActive;

    try {
      setStatusLoading(true);
      const res = await updateServiceCenter(cId, { isActive: nextStatus });
      if (res && res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Workshop "${confirmStatusCenter.name}" ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
        });
        setConfirmStatusCenter(null);
        fetchCentersData();
      } else {
        throw new Error(res?.message || 'Failed to update center status');
      }
    } catch (err) {
      console.error('Error updating center status:', err);
      alert(err.data?.message || err.message || 'Status update failed.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Delete Service Center Handler (Soft delete)
  const handleDeleteCenter = async () => {
    if (!confirmDeleteCenter) return;
    const cId = confirmDeleteCenter._id || confirmDeleteCenter.id;

    try {
      setDeleteLoading(true);
      const res = await deleteServiceCenter(cId);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Service center "${confirmDeleteCenter.name}" deactivated/deleted successfully.` });
        setConfirmDeleteCenter(null);
        fetchCentersData();
      } else {
        throw new Error(res?.message || 'Failed to delete service center');
      }
    } catch (err) {
      console.error('Error deleting service center:', err);
      alert(err.data?.message || err.message || 'Service center deletion failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCheckboxServiceToggle = (sId, formType) => {
    if (formType === 'add') {
      const current = addFormData.selectedServiceIds;
      if (current.includes(sId)) {
        setAddFormData({ ...addFormData, selectedServiceIds: current.filter((id) => id !== sId) });
      } else {
        setAddFormData({ ...addFormData, selectedServiceIds: [...current, sId] });
      }
    } else {
      const current = editFormData.selectedServiceIds;
      if (current.includes(sId)) {
        setEditFormData({ ...editFormData, selectedServiceIds: current.filter((id) => id !== sId) });
      } else {
        setEditFormData({ ...editFormData, selectedServiceIds: [...current, sId] });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Building size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Service Center Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Manage registered CarFix workshop locations, contact channels, operating hours, and service availability.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-card-secondary"
            onClick={fetchCentersData}
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
            <span>Add Service Center</span>
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
              placeholder="Search by center name, address, city, state, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* CITY FILTER */}
          <select
            className="form-control"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Cities</option>
            {uniqueCities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
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

      {/* SUMMARY METRIC STRIP */}
      <div className="dashboard-stats-grid">
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Service Centers</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{stats.total}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Workshops</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#10B981', marginTop: '0.2rem' }}>{stats.active}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Inactive Workshops</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#EF4444', marginTop: '0.2rem' }}>{stats.inactive}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Rating</span>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '1.4rem', color: '#F59E0B', marginTop: '0.2rem' }}>
            <Star size={18} fill="#F59E0B" /> {stats.avgRating}
          </strong>
        </div>
      </div>

      {/* SERVICE CENTERS TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading workshop locations...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Service Centers</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchCentersData}>
            Try Again
          </button>
        </div>
      ) : paginatedCenters.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Building size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>No Service Centers Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || cityFilter || statusFilter ? 'No service centers match your filter criteria.' : 'There are currently no service centers registered.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-responsive-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Center Name</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Services Offered</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCenters.map((c) => {
                  const cId = c._id || c.id;
                  const serviceCount = Array.isArray(c.services) ? c.services.length : 0;

                  return (
                    <tr key={cId}>
                      <td className="feature-name">
                        <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>{c.name}</strong>
                        {c.openingHours && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {c.openingHours}
                          </span>
                        )}
                      </td>
                      <td>
                        <div>{c.city}{c.state ? `, ${c.state}` : ''}</div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.address}
                        </span>
                      </td>
                      <td>
                        <div>{c.phone}</div>
                        {c.email && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {c.email}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#2563EB' }}>
                          {serviceCount} Services
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: '#F59E0B' }}>
                          <Star size={14} fill="#F59E0B" /> {c.rating || 0}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            ({c.totalReviews || 0})
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ display: 'inline-flex' }}>
                          <span className="status-dot" style={{ backgroundColor: c.isActive ? '#10B981' : '#EF4444' }}></span>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button type="button" className="icon-button" title="View Workshop Details" onClick={() => handleOpenViewModal(cId)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="icon-button" title="Edit Workshop" onClick={() => handleOpenEditModal(c)}>
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title={c.isActive ? 'Deactivate Workshop' : 'Activate Workshop'}
                            onClick={() => setConfirmStatusCenter(c)}
                            style={{ color: c.isActive ? '#DC2626' : '#16A34A' }}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title="Delete Workshop"
                            onClick={() => setConfirmDeleteCenter(c)}
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
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total workshops)
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

      {/* VIEW SERVICE CENTER MODAL */}
      {(viewingCenter || viewLoading) && (
        <div className="modal-overlay" onClick={() => setViewingCenter(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Service Center Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingCenter(null)}>
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
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{viewingCenter.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {viewingCenter.city}{viewingCenter.state ? `, ${viewingCenter.state}` : ''}
                  </span>
                </div>

                <div className="car-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Address:</strong>
                    <div>{viewingCenter.address}{viewingCenter.pincode ? ` - ${viewingCenter.pincode}` : ''}</div>
                  </div>
                  <div>
                    <strong>Phone:</strong>
                    <div>{viewingCenter.phone}</div>
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <div>{viewingCenter.email || 'N/A'}</div>
                  </div>
                  <div>
                    <strong>Opening Hours:</strong>
                    <div>{viewingCenter.openingHours || 'N/A'}</div>
                  </div>
                  <div>
                    <strong>Rating:</strong>
                    <div style={{ fontWeight: 700, color: '#F59E0B' }}>
                      ★ {viewingCenter.rating || 0} ({viewingCenter.totalReviews || 0} reviews)
                    </div>
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <div>{viewingCenter.isActive ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div>
                    <strong>Registered Date:</strong>
                    <div>{new Date(viewingCenter.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>

                  {viewingCenter.description && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Description:</strong>
                      <p style={{ marginTop: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        {viewingCenter.description}
                      </p>
                    </div>
                  )}

                  {Array.isArray(viewingCenter.services) && viewingCenter.services.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Services Offered ({viewingCenter.services.length}):</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                        {viewingCenter.services.map((srv) => (
                          <span
                            key={srv._id || srv.id || srv}
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(59, 130, 246, 0.12)',
                              color: '#2563EB',
                            }}
                          >
                            {typeof srv === 'object' ? srv.name : srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button type="button" className="btn-card-secondary" onClick={() => setViewingCenter(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD SERVICE CENTER MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Service Center</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateCenterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Center Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. CarFix Auto Workshop Downtown"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Full Address *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Plot 42, Industrial Area Phase 1"
                  value={addFormData.address}
                  onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>City *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Mumbai"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>State</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Maharashtra"
                    value={addFormData.state}
                    onChange={(e) => setAddFormData({ ...addFormData, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 400001"
                    value={addFormData.pincode}
                    onChange={(e) => setAddFormData({ ...addFormData, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Phone *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. 9876543210"
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. workshop@carfix.com"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Opening Hours</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 9:00 AM - 7:00 PM"
                  value={addFormData.openingHours}
                  onChange={(e) => setAddFormData({ ...addFormData, openingHours: e.target.value })}
                />
              </div>

              {availableServices.length > 0 && (
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    Offered Services ({addFormData.selectedServiceIds.length} selected)
                  </label>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {availableServices.map((srv) => {
                      const sId = srv._id || srv.id;
                      const checked = addFormData.selectedServiceIds.includes(sId);
                      return (
                        <label key={sId} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckboxServiceToggle(sId, 'add')}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{srv.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={addLoading}>
                  {addLoading ? 'Creating...' : 'Create Service Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SERVICE CENTER MODAL */}
      {editingCenter && (
        <div className="modal-overlay" onClick={() => setEditingCenter(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Service Center</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditingCenter(null)}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateCenterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Center Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Full Address *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>City *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.pincode}
                    onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Phone *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Opening Hours</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.openingHours}
                  onChange={(e) => setEditFormData({ ...editFormData, openingHours: e.target.value })}
                />
              </div>

              {availableServices.length > 0 && (
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    Offered Services ({editFormData.selectedServiceIds.length} selected)
                  </label>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {availableServices.map((srv) => {
                      const sId = srv._id || srv.id;
                      const checked = editFormData.selectedServiceIds.includes(sId);
                      return (
                        <label key={sId} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckboxServiceToggle(sId, 'edit')}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{srv.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setEditingCenter(null)}>
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
      {confirmStatusCenter && (
        <div className="modal-overlay" onClick={() => setConfirmStatusCenter(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {confirmStatusCenter.isActive ? 'Deactivate Workshop' : 'Activate Workshop'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmStatusCenter(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to {confirmStatusCenter.isActive ? 'deactivate' : 'activate'} service center{' '}
              <strong>{confirmStatusCenter.name}</strong>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmStatusCenter(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{
                  backgroundColor: confirmStatusCenter.isActive ? '#DC2626' : '#16A34A',
                  borderColor: confirmStatusCenter.isActive ? '#DC2626' : '#16A34A',
                }}
                disabled={statusLoading}
                onClick={handleToggleStatus}
              >
                {statusLoading ? 'Updating...' : confirmStatusCenter.isActive ? 'Deactivate Workshop' : 'Activate Workshop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteCenter && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteCenter(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#DC2626' }}>Delete / Deactivate Workshop</h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmDeleteCenter(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to remove workshop <strong>{confirmDeleteCenter.name}</strong> from active locations?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmDeleteCenter(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                disabled={deleteLoading}
                onClick={handleDeleteCenter}
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
