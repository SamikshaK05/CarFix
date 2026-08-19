import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit3, KeyRound, CheckCircle2, X, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../api/auth.api';

export default function Profile() {
  const { user, loading, updateUser } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');
  const [modalError, setModalError] = useState('');
  const [passModalError, setPassModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPassSubmitting, setIsPassSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  const [editData, setEditData] = useState({ name: '', email: '', phone: '', location: 'Pune, Maharashtra' });
  const [passData, setPassData] = useState({ currentPass: '', newPass: '', confirmPass: '' });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: 'Pune, Maharashtra',
      });
    }
  }, [user]);

  const handleOpenEditModal = () => {
    if (user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: 'Pune, Maharashtra',
      });
    }
    setModalError('');
    setShowEditModal(true);
  };

  const handleOpenPassModal = () => {
    setPassData({ currentPass: '', newPass: '', confirmPass: '' });
    setPassModalError('');
    setShowPassModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!editData.name.trim() || !editData.email.trim()) {
      setModalError('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updateProfile({
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
      });

      if (response && response.success && response.data?.user) {
        updateUser(response.data.user);
        setShowEditModal(false);
        setSuccessMsg('Profile information updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        throw new Error(response?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setModalError(err.data?.message || err.message || 'Error updating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    setPassModalError('');

    if (!passData.currentPass) {
      setPassModalError('Current password is required.');
      return;
    }
    if (!passData.newPass) {
      setPassModalError('New password is required.');
      return;
    }
    if (passData.newPass.length < 8) {
      setPassModalError('New password must be at least 8 characters.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passData.newPass)) {
      setPassModalError('New password must contain uppercase, lowercase & a number.');
      return;
    }
    if (passData.newPass !== passData.confirmPass) {
      setPassModalError('New passwords do not match.');
      return;
    }

    setIsPassSubmitting(true);

    try {
      const response = await changePassword(passData.currentPass, passData.newPass);
      if (response && response.success) {
        setShowPassModal(false);
        setPassData({ currentPass: '', newPass: '', confirmPass: '' });
        setSuccessMsg(response.message || 'Password changed successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        throw new Error(response?.message || 'Failed to update password.');
      }
    } catch (err) {
      setPassModalError(err.data?.message || err.message || 'Failed to change password. Please check your credentials.');
    } finally {
      setIsPassSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading profile information...</p>
      </div>
    );
  }

  const currentUser = user || {
    name: 'Customer',
    email: 'N/A',
    phone: 'N/A',
    role: 'CUSTOMER',
    createdAt: new Date(),
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
          My Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Manage your personal information and security settings.
        </p>
      </div>

      {successMsg && (
        <div className="form-success-banner" role="status">
          <CheckCircle2 size={20} className="success-icon" />
          <div className="success-content">
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* PROFILE DETAILS GRID */}
      <div className="profile-grid">
        {/* PERSONAL & CONTACT INFORMATION */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
              Personal & Contact Information
            </h3>
            <button
              type="button"
              className="btn-card-secondary"
              onClick={handleOpenEditModal}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <Edit3 size={15} style={{ marginRight: '0.3rem' }} /> Edit Profile
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="info-icon-wrapper">
                <User size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Full Name</span>
                <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>{currentUser.name}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="info-icon-wrapper">
                <Mail size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Email Address</span>
                <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>{currentUser.email}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="info-icon-wrapper">
                <Phone size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Phone Number</span>
                <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>{currentUser.phone || 'Not provided'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="info-icon-wrapper">
                <MapPin size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Location</span>
                <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>{editData.location}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY SETTINGS */}
        <div
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
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
              Account Security
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5' }}>
              Keep your account safe by updating your password regularly.
            </p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '10px', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Member Status</span>
            <strong style={{ color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <ShieldCheck size={16} color="var(--primary-accent)" />
              Active {currentUser.role} (Member since {memberSinceDate})
            </strong>
          </div>

          <div>
            <button
              type="button"
              className="btn-card-secondary"
              onClick={handleOpenPassModal}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <KeyRound size={16} style={{ marginRight: '0.4rem' }} />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
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

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPassModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Change Password</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowPassModal(false)} disabled={isPassSubmitting}>
                <X size={20} />
              </button>
            </div>

            {passModalError && (
              <div className="pricing-alert-box" style={{ marginBottom: '1rem', padding: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                <AlertCircle size={18} className="alert-icon" style={{ color: '#ef4444' }} />
                <div className="alert-text">
                  <p style={{ color: '#ef4444', fontSize: '0.88rem', fontWeight: 500 }}>{passModalError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePassSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={passData.currentPass}
                  onChange={(e) => setPassData({ ...passData, currentPass: e.target.value })}
                  disabled={isPassSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={passData.newPass}
                  onChange={(e) => setPassData({ ...passData, newPass: e.target.value })}
                  disabled={isPassSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={passData.confirmPass}
                  onChange={(e) => setPassData({ ...passData, confirmPass: e.target.value })}
                  disabled={isPassSubmitting}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setShowPassModal(false)} disabled={isPassSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={isPassSubmitting}>
                  {isPassSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
