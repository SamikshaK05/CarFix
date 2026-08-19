import { useState, useEffect } from 'react';
import { Car, Plus, Trash2, Edit3, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../api/vehicles.api';

export default function MyCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCarId, setEditingCarId] = useState(null);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    registration: '',
    fuel: 'Petrol',
    year: '2024',
  });

  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVehicles();
      const rawData = response.data || response;
      const list = Array.isArray(rawData) ? rawData : [];
      setCars(list);
    } catch (err) {
      console.error('Error fetching vehicles:', err.message);
      setError(err.data?.message || err.message || 'Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const openAddModal = () => {
    setEditingCarId(null);
    setFormData({ brand: '', model: '', registration: '', fuel: 'Petrol', year: '2024' });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (car) => {
    setEditingCarId(car._id || car.id);
    setFormData({
      brand: car.make || car.brand || '',
      model: car.model || '',
      registration: car.registrationNumber || car.registration || '',
      fuel: car.fuelType || car.fuel || 'Petrol',
      year: car.year ? String(car.year) : '2024',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.brand.trim() || !formData.model.trim() || !formData.registration.trim()) {
      setModalError('Please fill in all required fields (Brand, Model, Registration Number).');
      return;
    }

    setIsSubmitting(true);

    const vehiclePayload = {
      make: formData.brand.trim(),
      model: formData.model.trim(),
      registrationNumber: formData.registration.trim().toUpperCase(),
      fuelType: formData.fuel === 'Electric' ? 'EV' : formData.fuel,
      year: Number(formData.year) || new Date().getFullYear(),
    };

    try {
      if (editingCarId) {
        await updateVehicle(editingCarId, vehiclePayload);
        setSuccessMsg(`Vehicle updated successfully.`);
      } else {
        await createVehicle(vehiclePayload);
        setSuccessMsg(`Vehicle "${vehiclePayload.make} ${vehiclePayload.model}" added successfully.`);
      }

      setShowModal(false);
      setFormData({ brand: '', model: '', registration: '', fuel: 'Petrol', year: '2024' });
      fetchCars();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setModalError(err.data?.message || err.message || 'Failed to save vehicle. Registration number might already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCar = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove vehicle "${name}"?`)) return;

    try {
      setDeletingId(id);
      await deleteVehicle(id);
      setSuccessMsg(`Vehicle removed successfully.`);
      fetchCars();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert(err.data?.message || err.message || 'Failed to delete vehicle.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
            My Cars
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Manage your registered vehicles and maintenance schedules.
          </p>
        </div>

        <button
          type="button"
          className="btn-card-primary"
          onClick={openAddModal}
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <Plus size={18} style={{ marginRight: '0.4rem' }} />
          Add New Car
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

      {error && (
        <div className="pricing-alert-box" style={{ padding: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <AlertCircle size={20} className="alert-icon" style={{ color: '#ef4444' }} />
          <div className="alert-text">
            <p style={{ color: '#ef4444', fontWeight: 500 }}>{error}</p>
          </div>
        </div>
      )}

      {/* CARS GRID */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading registered vehicles...</p>
        </div>
      ) : cars.length > 0 ? (
        <div className="cars-grid">
          {cars.map((car) => {
            const carId = car._id || car.id;
            const carName = `${car.make || car.brand || ''} ${car.model || ''}`.trim() || 'Vehicle';
            const regNum = car.registrationNumber || car.registration || 'N/A';
            const fuel = car.fuelType || car.fuel || 'Petrol';
            const year = car.year ? String(car.year) : '2024';

            return (
              <div
                key={carId}
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  opacity: deletingId === carId ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div className="info-icon-wrapper">
                      <Car size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary-dark)' }}>{carName}</h3>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--primary-accent)' }}>
                        {regNum}
                      </span>
                    </div>
                  </div>
                  <span className="category-badge maintenance">{fuel}</span>
                </div>

                <div className="car-info-grid">
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Manufacturing Year</span>
                    <strong>{year}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Last Service</span>
                    <strong>Not serviced yet</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Next Service</span>
                    <strong style={{ color: 'var(--primary-accent)' }}>Recommended</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-card-secondary"
                    onClick={() => openEditModal(car)}
                    disabled={deletingId === carId}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    <Edit3 size={15} style={{ marginRight: '0.3rem' }} /> Edit
                  </button>

                  <button
                    type="button"
                    className="btn-card-secondary"
                    onClick={() => handleRemoveCar(carId, carName)}
                    disabled={deletingId === carId}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: '#DC2626' }}
                  >
                    <Trash2 size={15} style={{ marginRight: '0.3rem' }} />
                    {deletingId === carId ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Car size={40} style={{ color: 'var(--text-secondary)', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>No Vehicles Registered Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>Add your first car to manage service bookings and maintenance history.</p>
          <button type="button" className="btn-card-primary" onClick={openAddModal}>
            <Plus size={18} style={{ marginRight: '0.4rem' }} /> Add Your Car Now
          </button>
        </div>
      )}

      {/* ADD / EDIT CAR MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">{editingCarId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="pricing-alert-box" style={{ marginBottom: '1rem', padding: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                <AlertCircle size={18} className="alert-icon" style={{ color: '#ef4444' }} />
                <div className="alert-text">
                  <p style={{ color: '#ef4444', fontSize: '0.88rem', fontWeight: 500 }}>{modalError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Car Brand *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Hyundai, Honda, Tata"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Car Model *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Creta, City, Nexon"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MH 12 AB 1234"
                  value={formData.registration}
                  onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select
                    className="category-select"
                    value={formData.fuel}
                    onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric / EV</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Manufacturing Year</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="2024"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={isSubmitting}>
                  {isSubmitting ? (editingCarId ? 'Updating...' : 'Saving...') : editingCarId ? 'Update Vehicle' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
