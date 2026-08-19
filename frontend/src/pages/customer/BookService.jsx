import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle, Car, MapPin, Calendar, Plus } from 'lucide-react';
import { getVehicles } from '../../api/vehicles.api';
import { getServices } from '../../api/services.api';
import { getServiceCenters } from '../../api/serviceCenters.api';
import { createBooking } from '../../api/bookings.api';

const TIME_SLOTS = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];

// Helper to get tomorrow's date string YYYY-MM-DD
const getTomorrowDateStr = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export default function BookService() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTomorrowDateStr());
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  const fetchBookingOptions = async () => {
    try {
      setLoadingOptions(true);
      setOptionsError(null);

      const [vehRes, srvRes, ctrRes] = await Promise.all([
        getVehicles(),
        getServices(),
        getServiceCenters(),
      ]);

      const vehList = vehRes.data || vehRes || [];
      const srvList = srvRes.data || srvRes || [];
      const ctrList = ctrRes.data || ctrRes || [];

      setVehicles(Array.isArray(vehList) ? vehList : []);
      setServices(Array.isArray(srvList) ? srvList : []);
      setServiceCenters(Array.isArray(ctrList) ? ctrList : []);

      if (vehList.length > 0) setSelectedVehicleId(vehList[0]._id || vehList[0].id);
      if (srvList.length > 0) setSelectedServiceId(srvList[0]._id || srvList[0].id);
      if (ctrList.length > 0) setSelectedCenterId(ctrList[0]._id || ctrList[0].id);
    } catch (err) {
      console.error('Error loading booking options:', err.message);
      setOptionsError(err.data?.message || err.message || 'Failed to load booking options. Please try again.');
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchBookingOptions();
  }, []);

  const selectedVehicleObj = vehicles.find((v) => (v._id || v.id) === selectedVehicleId);
  const selectedServiceObj = services.find((s) => (s._id || s.id) === selectedServiceId);
  const selectedCenterObj = serviceCenters.find((c) => (c._id || c.id) === selectedCenterId);

  const handleConfirmBooking = async () => {
    setBookingError('');

    if (!selectedVehicleId) {
      setBookingError('Please select a vehicle.');
      return;
    }
    if (!selectedServiceId) {
      setBookingError('Please select a service.');
      return;
    }
    if (!selectedCenterId) {
      setBookingError('Please select a service center.');
      return;
    }
    if (!selectedDate) {
      setBookingError('Please select a service date.');
      return;
    }
    if (!selectedTime) {
      setBookingError('Please select a preferred time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        vehicle: selectedVehicleId,
        service: selectedServiceId,
        serviceCenter: selectedCenterId,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        notes: notes ? notes.trim() : undefined,
      };

      const response = await createBooking(payload);

      if (response && response.success) {
        setCreatedBooking(response.data);
      } else {
        throw new Error(response.message || 'Booking creation failed');
      }
    } catch (err) {
      console.error('Error submitting booking:', err);
      const errMsg = err.data?.message || err.message || 'Failed to create booking. Please verify date and time slot availability.';
      setBookingError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
          Book a Service
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Follow 5 quick steps to schedule your car service appointment.
        </p>
      </div>

      {/* STEP INDICATOR */}
      <div className="booking-steps-bar">
        {[
          { num: 1, label: 'Vehicle' },
          { num: 2, label: 'Service' },
          { num: 3, label: 'Center' },
          { num: 4, label: 'Date & Time' },
          { num: 5, label: 'Review' },
        ].map((s) => (
          <div
            key={s.num}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: step >= s.num ? 'var(--primary-dark)' : 'var(--text-secondary)',
              fontWeight: step === s.num ? '700' : '500',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step >= s.num ? 'var(--primary-accent)' : 'var(--border-color)',
                color: step >= s.num ? 'var(--white)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              {s.num}
            </div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* SUCCESS BANNER UPON CREATION */}
      {createdBooking && (
        <div className="form-success-banner" role="status" style={{ padding: '1.75rem' }}>
          <CheckCircle2 size={26} className="success-icon" />
          <div className="success-content">
            <h4 style={{ fontSize: '1.2rem' }}>Booking Confirmed Successfully!</h4>
            <p style={{ marginTop: '0.4rem', fontSize: '1rem' }}>
              Your appointment for <strong>{createdBooking.service?.name}</strong> has been scheduled on{' '}
              <strong>{new Date(createdBooking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {createdBooking.bookingTime}</strong>.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <Link to="/customer/dashboard" className="btn-card-primary" style={{ textDecoration: 'none' }}>
                Go to Dashboard
              </Link>
              <button
                type="button"
                className="btn-card-secondary"
                onClick={() => {
                  setCreatedBooking(null);
                  setStep(1);
                  setBookingError('');
                }}
              >
                Book Another Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPTIONS LOADING STATE */}
      {loadingOptions && !createdBooking && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading vehicles and service centers...</p>
        </div>
      )}

      {/* OPTIONS ERROR STATE */}
      {optionsError && !createdBooking && (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Failed to Load Options</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{optionsError}</p>
          <button type="button" className="btn-card-primary" onClick={fetchBookingOptions}>
            Try Again
          </button>
        </div>
      )}

      {/* STEP CONTENT CONTAINER */}
      {!loadingOptions && !optionsError && !createdBooking && (
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {bookingError && (
            <div className="pricing-alert-box" style={{ padding: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <AlertCircle size={20} className="alert-icon" style={{ color: '#ef4444' }} />
              <div className="alert-text">
                <p style={{ color: '#ef4444', fontWeight: 500 }}>{bookingError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: VEHICLE */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                Step 1: Select Vehicle
              </h3>
              {vehicles.length > 0 ? (
                <div className="cars-grid">
                  {vehicles.map((v) => {
                    const vId = v._id || v.id;
                    const vName = `${v.make || ''} ${v.model || ''}`.trim() || 'Vehicle';
                    const isSelected = selectedVehicleId === vId;
                    return (
                      <button
                        key={vId}
                        type="button"
                        style={{
                          padding: '1.25rem',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-light)',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedVehicleId(vId)}
                      >
                        <strong style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', display: 'block' }}>{vName}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reg: {v.registrationNumber || v.registration || 'N/A'}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--bg-light)', borderRadius: '12px' }}>
                  <Car size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>You have no registered vehicles yet. Please add a vehicle first.</p>
                  <Link to="/customer/cars" className="btn-card-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Add Vehicle Now
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SERVICE */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                Step 2: Select Service
              </h3>
              <div className="booking-services-grid">
                {services.map((srv) => {
                  const sId = srv._id || srv.id;
                  const isSelected = selectedServiceId === sId;
                  return (
                    <button
                      key={sId}
                      type="button"
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-light)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        color: 'var(--primary-dark)',
                      }}
                      onClick={() => setSelectedServiceId(sId)}
                    >
                      <div>{srv.name}</div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: '700', marginTop: '0.2rem', display: 'block' }}>
                        ₹{srv.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CENTER */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                Step 3: Select Service Center
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {serviceCenters.map((c) => {
                  const cId = c._id || c.id;
                  const isSelected = selectedCenterId === cId;
                  return (
                    <button
                      key={cId}
                      type="button"
                      style={{
                        padding: '1.1rem 1.25rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-light)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: 'var(--primary-dark)',
                      }}
                      onClick={() => setSelectedCenterId(cId)}
                    >
                      <div style={{ fontSize: '1.05rem' }}>{c.name}</div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal', display: 'block', marginTop: '0.2rem' }}>
                        {c.address || c.location || c.city}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: DATE & TIME */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                Step 4: Select Date & Time
              </h3>
              <div className="booking-datetime-grid">
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Choose Service Date</label>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Choose Preferred Time Slot</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: selectedTime === t ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                          backgroundColor: selectedTime === t ? 'var(--primary-accent)' : 'var(--bg-light)',
                          color: selectedTime === t ? 'var(--white)' : 'var(--primary-dark)',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedTime(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                Step 5: Review & Confirm Booking
              </h3>
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Selected Vehicle:</span>
                  <strong style={{ color: 'var(--primary-dark)' }}>
                    {selectedVehicleObj ? `${selectedVehicleObj.make || ''} ${selectedVehicleObj.model || ''} (${selectedVehicleObj.registrationNumber || ''})` : 'None Selected'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Service Type:</span>
                  <strong style={{ color: 'var(--primary-dark)' }}>
                    {selectedServiceObj ? `${selectedServiceObj.name} (₹${selectedServiceObj.price})` : 'None Selected'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Service Center:</span>
                  <strong style={{ color: 'var(--primary-dark)' }}>
                    {selectedCenterObj ? selectedCenterObj.name : 'None Selected'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Date & Time Slot:</span>
                  <strong style={{ color: 'var(--primary-accent)' }}>
                    {selectedDate} at {selectedTime}
                  </strong>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label">Special Notes / Requests (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Please check squeaky brakes or oil leak"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP NAVIGATION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            {step > 1 ? (
              <button type="button" className="btn-card-secondary" onClick={() => setStep((s) => s - 1)} disabled={isSubmitting}>
                <ArrowLeft size={16} style={{ marginRight: '0.4rem' }} /> Back
              </button>
            ) : <div></div>}

            {step < 5 ? (
              <button
                type="button"
                className="btn-card-primary"
                onClick={() => {
                  if (step === 1 && !selectedVehicleId) {
                    setBookingError('Please select or add a vehicle before proceeding.');
                    return;
                  }
                  setBookingError('');
                  setStep((s) => s + 1);
                }}
              >
                Next Step <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
              </button>
            ) : (
              <button type="button" className="btn-card-primary" onClick={handleConfirmBooking} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', marginRight: '0.4rem' }} />
                    Submitting Booking...
                  </>
                ) : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
