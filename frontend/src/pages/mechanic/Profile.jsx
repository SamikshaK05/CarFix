import { useState, useEffect } from 'react';
import { User, Mail, Phone, ShieldCheck, CheckCircle2, Loader2, Wrench, Calendar, MapPin, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/auth.api';

export default function MechanicProfile() {
  const { user, loading, checkAuth } = useAuth();
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading mechanic profile...</p>
      </div>
    );
  }

  const currentUser = user || {
    name: 'Technician',
    email: 'N/A',
    phone: 'N/A',
    role: 'MECHANIC',
    createdAt: new Date(),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.name.trim() === '') {
      setErrorMsg('Name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setInfoMsg('');

      const response = await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      if (response && response.success) {
        setInfoMsg('Profile information updated successfully.');
        setTimeout(() => setInfoMsg(''), 4000);
        if (checkAuth) await checkAuth();
      } else {
        throw new Error(response?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err.message);
      setErrorMsg(err.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberSinceDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
    : '2026';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
          Mechanic Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          View and manage your technician contact profile and security credentials.
        </p>
      </div>

      {infoMsg && (
        <div className="form-success-banner" role="status">
          <CheckCircle2 size={20} className="success-icon" />
          <div className="success-content">
            <p>{infoMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* PROFILE DETAILS GRID */}
      <div className="profile-grid">
        {/* EDITABLE PERSONAL INFORMATION */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
            Technician Details
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' }}>
                Email Address (Read Only)
              </label>
              <input
                type="email"
                className="form-control"
                disabled
                value={currentUser.email}
                style={{ backgroundColor: 'var(--bg-light)', cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' }}>
                Contact Phone
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 00000"
              />
            </div>

            <button
              type="submit"
              className="btn-card-primary"
              disabled={isSubmitting}
              style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {isSubmitting ? <Loader2 size={16} className="spinning-loader" style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* ACCOUNT ROLE & AUTHORIZATION */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
            Authorization & Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="profile-field-row" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <ShieldCheck size={20} color="#10B981" />
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>System Role</span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#2563EB',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginTop: '0.2rem',
                  }}
                >
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="profile-field-row" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <CheckCircle2 size={20} color="#10B981" />
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Account Status</span>
                <strong style={{ color: '#10B981' }}>Active Account</strong>
              </div>
            </div>

            <div className="profile-field-row" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Calendar size={20} color="#3B82F6" />
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Member Since</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--primary-dark)' }}>{memberSinceDate}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
