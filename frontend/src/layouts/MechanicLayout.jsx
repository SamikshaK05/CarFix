import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import MechanicSidebar from '../components/mechanic/MechanicSidebar';
import MechanicHeader from '../components/mechanic/MechanicHeader';
import { useAuth } from '../context/AuthContext';
import { LogOut, X } from 'lucide-react';
import '../components/customer/CustomerLayout.css';

export default function MechanicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getMechanicPageTitle = (path) => {
    if (path.includes('/mechanic/jobs/') && path !== '/mechanic/jobs') {
      return 'Service Job Details';
    }
    if (path.includes('/mechanic/jobs')) return 'My Assigned Jobs';
    if (path.includes('/mechanic/profile')) return 'Mechanic Profile';
    return 'Mechanic Workspace';
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="customer-layout-wrapper">
      {/* FIXED / MOBILE MECHANIC SIDEBAR */}
      <MechanicSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenLogoutModal={() => setShowLogoutModal(true)}
      />

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MAIN MECHANIC CONTENT CONTAINER */}
      <div className="customer-main-content">
        <MechanicHeader
          title={getMechanicPageTitle(location.pathname)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="customer-page-content">
          <Outlet />
        </main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={22} color="#EF4444" />
                Confirm Logout
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.5' }}>
              Are you sure you want to log out of the Mechanic Portal? Any unsaved status changes may be lost.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-card-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                onClick={handleConfirmLogout}
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
