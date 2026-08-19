import { useState, useEffect, useCallback } from 'react';
import {
  Car,
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
  User,
  Gauge,
  Fuel,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../api/vehicles.api';
import { getAdminUsers } from '../../api/users.api';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    userId: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    registrationNumber: '',
    fuelType: 'Petrol',
    color: '',
    mileage: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editFormData, setEditFormData] = useState({
    userId: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    registrationNumber: '',
    fuelType: 'Petrol',
    color: '',
    mileage: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [confirmDeleteVehicle, setConfirmDeleteVehicle] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Vehicles & Platform Users for Owner Selection
  const fetchVehiclesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [vehiclesRes, usersRes] = await Promise.all([
        getVehicles(),
        getAdminUsers({ limit: 100 }).catch(() => null),
      ]);

      if (vehiclesRes && vehiclesRes.success) {
        setVehicles(vehiclesRes.data || []);
      } else {
        throw new Error(vehiclesRes?.message || 'Failed to fetch vehicle fleet data');
      }

      if (usersRes && usersRes.success && Array.isArray(usersRes.data)) {
        setUsersList(usersRes.data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err.data?.message || err.message || 'Unable to load vehicle fleet. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehiclesData();
  }, [fetchVehiclesData]);

  // Client-side multi-field filtering
  const filteredVehicles = vehicles.filter((v) => {
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const makeMatch = (v.make || '').toLowerCase().includes(term);
      const modelMatch = (v.model || '').toLowerCase().includes(term);
      const regMatch = (v.registrationNumber || '').toLowerCase().includes(term);
      const ownerName = (v.user?.name || '').toLowerCase().includes(term);
      const ownerEmail = (v.user?.email || '').toLowerCase().includes(term);
      const ownerPhone = (v.user?.phone || '').toLowerCase().includes(term);

      if (!makeMatch && !modelMatch && !regMatch && !ownerName && !ownerEmail && !ownerPhone) {
        return false;
      }
    }

    if (fuelFilter && v.fuelType !== fuelFilter) {
      return false;
    }

    return true;
  });

  const totalItems = filteredVehicles.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedVehicles = filteredVehicles.slice((page - 1) * limit, page * limit);

  // Summary Metrics Calculation
  const evCount = vehicles.filter((v) => v.fuelType === 'Electric' || v.fuelType === 'Hybrid').length;
  const iceCount = vehicles.filter((v) => v.fuelType === 'Petrol' || v.fuelType === 'Diesel' || v.fuelType === 'CNG').length;
  const vehiclesWithMileage = vehicles.filter((v) => typeof v.mileage === 'number' && v.mileage > 0);
  const avgMileageVal = vehiclesWithMileage.length > 0
    ? Math.round(vehiclesWithMileage.reduce((sum, v) => sum + v.mileage, 0) / vehiclesWithMileage.length)
    : 0;

  const stats = {
    total: vehicles.length,
    evCount,
    iceCount,
    avgMileage: avgMileageVal.toLocaleString('en-IN'),
  };

  // View Vehicle Detail Modal Handler
  const handleOpenViewModal = async (vehicleId) => {
    try {
      setViewLoading(true);
      setViewingVehicle(null);
      const res = await getVehicleById(vehicleId);
      if (res && res.success && res.data) {
        setViewingVehicle(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch vehicle details');
      }
    } catch (err) {
      console.error('Error viewing vehicle:', err);
      alert(err.data?.message || err.message || 'Could not load vehicle details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Add Vehicle Form Submission Handler
  const handleCreateVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!addFormData.userId) {
      setAddError('Please select a platform user as vehicle owner.');
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);

      const payload = {
        user: addFormData.userId,
        make: addFormData.make.trim(),
        model: addFormData.model.trim(),
        year: parseInt(addFormData.year, 10),
        registrationNumber: addFormData.registrationNumber.trim().toUpperCase(),
        fuelType: addFormData.fuelType,
        color: addFormData.color ? addFormData.color.trim() : null,
        mileage: addFormData.mileage !== '' ? parseInt(addFormData.mileage, 10) : 0,
      };

      const res = await createVehicle(payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Vehicle "${res.data?.make || ''} ${res.data?.model || ''}" (${res.data?.registrationNumber || ''}) added successfully.` });
        setShowAddModal(false);
        setAddFormData({
          userId: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          registrationNumber: '',
          fuelType: 'Petrol',
          color: '',
          mileage: '',
        });
        fetchVehiclesData();
      } else {
        throw new Error(res?.message || 'Failed to create vehicle');
      }
    } catch (err) {
      console.error('Error creating vehicle:', err);
      setAddError(err.data?.message || err.message || 'Failed to create vehicle.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Vehicle Modal Open & Submit Handlers
  const handleOpenEditModal = (v) => {
    setEditingVehicle(v);
    const currentUserId = typeof v.user === 'object' ? v.user._id || v.user.id : v.user;
    setEditFormData({
      userId: currentUserId || '',
      make: v.make || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear(),
      registrationNumber: v.registrationNumber || '',
      fuelType: v.fuelType || 'Petrol',
      color: v.color || '',
      mileage: v.mileage !== undefined && v.mileage !== null ? v.mileage : '',
    });
    setEditError(null);
  };

  const handleUpdateVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;
    const vId = editingVehicle._id || editingVehicle.id;

    try {
      setEditLoading(true);
      setEditError(null);

      const payload = {
        user: editFormData.userId,
        make: editFormData.make.trim(),
        model: editFormData.model.trim(),
        year: parseInt(editFormData.year, 10),
        registrationNumber: editFormData.registrationNumber.trim().toUpperCase(),
        fuelType: editFormData.fuelType,
        color: editFormData.color ? editFormData.color.trim() : null,
        mileage: editFormData.mileage !== '' ? parseInt(editFormData.mileage, 10) : 0,
      };

      const res = await updateVehicle(vId, payload);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Vehicle "${res.data?.make || ''} ${res.data?.model || ''}" updated successfully.` });
        setEditingVehicle(null);
        fetchVehiclesData();
      } else {
        throw new Error(res?.message || 'Failed to update vehicle');
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      setEditError(err.data?.message || err.message || 'Failed to update vehicle.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Vehicle Handler
  const handleDeleteVehicleSubmit = async () => {
    if (!confirmDeleteVehicle) return;
    const vId = confirmDeleteVehicle._id || confirmDeleteVehicle.id;

    try {
      setDeleteLoading(true);
      const res = await deleteVehicle(vId);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `Vehicle "${confirmDeleteVehicle.make} ${confirmDeleteVehicle.model}" deleted successfully.` });
        setConfirmDeleteVehicle(null);
        fetchVehiclesData();
      } else {
        throw new Error(res?.message || 'Failed to delete vehicle');
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert(err.data?.message || err.message || 'Vehicle deletion failed.');
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
            <Car size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Vehicle Fleet Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Overview and management of customer vehicles registered across the CarFix platform.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-card-secondary"
            onClick={fetchVehiclesData}
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
            <span>Add Vehicle</span>
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
              placeholder="Search make, model, reg #, or owner details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* FUEL TYPE FILTER */}
          <select
            className="form-control"
            value={fuelFilter}
            onChange={(e) => {
              setFuelFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Fuel Types</option>
            {FUEL_TYPES.map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div className="dashboard-stats-grid">
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Fleet Vehicles</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{stats.total}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Electric / Hybrid</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#10B981', marginTop: '0.2rem' }}>{stats.evCount}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Petrol / Diesel / CNG</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-accent)', marginTop: '0.2rem' }}>{stats.iceCount}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Mileage</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>
            {stats.avgMileage} km
          </strong>
        </div>
      </div>

      {/* VEHICLES TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading vehicle fleet...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Vehicle Fleet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchVehiclesData}>
            Try Again
          </button>
        </div>
      ) : paginatedVehicles.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Car size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>No Vehicles Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || fuelFilter ? 'No vehicles match your filter criteria.' : 'There are currently no vehicles registered in the fleet.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-responsive-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Vehicle Make & Model</th>
                  <th>Reg Number</th>
                  <th>Owner</th>
                  <th>Fuel Type</th>
                  <th>Color</th>
                  <th>Mileage</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.map((v) => {
                  const vId = v._id || v.id;
                  const ownerName = v.user?.name || 'Owner';
                  const ownerEmail = v.user?.email || '';
                  const createdDateStr = v.createdAt
                    ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={vId}>
                      <td className="feature-name">
                        <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>
                          {v.make} {v.model}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                          Year: {v.year}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary-accent)', fontSize: '0.88rem' }}>
                          {v.registrationNumber}
                        </span>
                      </td>
                      <td>
                        <strong>{ownerName}</strong>
                        {ownerEmail && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {ownerEmail}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: v.fuelType === 'Electric' || v.fuelType === 'Hybrid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: v.fuelType === 'Electric' || v.fuelType === 'Hybrid' ? '#059669' : '#2563EB',
                          }}
                        >
                          {v.fuelType}
                        </span>
                      </td>
                      <td>{v.color || 'N/A'}</td>
                      <td>{v.mileage ? `${v.mileage.toLocaleString('en-IN')} km` : 'N/A'}</td>
                      <td>{createdDateStr}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button type="button" className="icon-button" title="View Vehicle Details" onClick={() => handleOpenViewModal(vId)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="icon-button" title="Edit Vehicle" onClick={() => handleOpenEditModal(v)}>
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title="Delete Vehicle"
                            onClick={() => setConfirmDeleteVehicle(v)}
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
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total vehicles)
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

      {/* VIEW VEHICLE MODAL */}
      {(viewingVehicle || viewLoading) && (
        <div className="modal-overlay" onClick={() => setViewingVehicle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Vehicle Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingVehicle(null)}>
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
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {viewingVehicle.make} {viewingVehicle.model} ({viewingVehicle.year})
                  </h4>
                  <span style={{ fontSize: '0.9rem', color: 'var(--primary-accent)', fontWeight: 700 }}>
                    {viewingVehicle.registrationNumber}
                  </span>
                </div>

                <div className="car-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <strong>Owner Name:</strong>
                    <div>{viewingVehicle.user?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <strong>Owner Contact:</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{viewingVehicle.user?.email || 'N/A'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{viewingVehicle.user?.phone || ''}</div>
                  </div>
                  <div>
                    <strong>Fuel Type:</strong>
                    <div>{viewingVehicle.fuelType}</div>
                  </div>
                  <div>
                    <strong>Color:</strong>
                    <div>{viewingVehicle.color || 'Not specified'}</div>
                  </div>
                  <div>
                    <strong>Mileage:</strong>
                    <div>{viewingVehicle.mileage ? `${viewingVehicle.mileage.toLocaleString('en-IN')} km` : '0 km'}</div>
                  </div>
                  <div>
                    <strong>Registered On:</strong>
                    <div>{new Date(viewingVehicle.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button type="button" className="btn-card-secondary" onClick={() => setViewingVehicle(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Vehicle to Fleet</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateVehicleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Select Owner *</label>
                <select
                  className="form-control"
                  required
                  value={addFormData.userId}
                  onChange={(e) => setAddFormData({ ...addFormData, userId: e.target.value })}
                >
                  <option value="">-- Select Platform User --</option>
                  {usersList.map((u) => {
                    const uId = u._id || u.id;
                    return (
                      <option key={uId} value={uId}>
                        {u.name} ({u.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Make *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Maruti Suzuki"
                    value={addFormData.make}
                    onChange={(e) => setAddFormData({ ...addFormData, make: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Model *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Swift"
                    value={addFormData.model}
                    onChange={(e) => setAddFormData({ ...addFormData, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Year *</label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="form-control"
                    required
                    value={addFormData.year}
                    onChange={(e) => setAddFormData({ ...addFormData, year: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Registration Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. MH12AB1234"
                    value={addFormData.registrationNumber}
                    onChange={(e) => setAddFormData({ ...addFormData, registrationNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Fuel Type *</label>
                  <select
                    className="form-control"
                    value={addFormData.fuelType}
                    onChange={(e) => setAddFormData({ ...addFormData, fuelType: e.target.value })}
                  >
                    {FUEL_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Color</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Red"
                    value={addFormData.color}
                    onChange={(e) => setAddFormData({ ...addFormData, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Mileage (km)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 25000"
                    value={addFormData.mileage}
                    onChange={(e) => setAddFormData({ ...addFormData, mileage: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={addLoading}>
                  {addLoading ? 'Creating...' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {editingVehicle && (
        <div className="modal-overlay" onClick={() => setEditingVehicle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Vehicle</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditingVehicle(null)}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateVehicleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Owner *</label>
                <select
                  className="form-control"
                  required
                  value={editFormData.userId}
                  onChange={(e) => setEditFormData({ ...editFormData, userId: e.target.value })}
                >
                  <option value="">-- Select Owner --</option>
                  {usersList.map((u) => {
                    const uId = u._id || u.id;
                    return (
                      <option key={uId} value={uId}>
                        {u.name} ({u.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Make *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editFormData.make}
                    onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Model *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Year *</label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="form-control"
                    required
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Registration Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editFormData.registrationNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Fuel Type *</label>
                  <select
                    className="form-control"
                    value={editFormData.fuelType}
                    onChange={(e) => setEditFormData({ ...editFormData, fuelType: e.target.value })}
                  >
                    {FUEL_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Color</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Mileage (km)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={editFormData.mileage}
                    onChange={(e) => setEditFormData({ ...editFormData, mileage: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setEditingVehicle(null)}>
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

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteVehicle && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteVehicle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#DC2626' }}>Delete Vehicle</h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmDeleteVehicle(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to permanently delete vehicle{' '}
              <strong>
                {confirmDeleteVehicle.make} {confirmDeleteVehicle.model} ({confirmDeleteVehicle.registrationNumber})
              </strong>
              ?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmDeleteVehicle(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                disabled={deleteLoading}
                onClick={handleDeleteVehicleSubmit}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
