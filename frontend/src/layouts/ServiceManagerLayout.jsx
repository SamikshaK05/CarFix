import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ServiceManagerSidebar from '../components/serviceManager/ServiceManagerSidebar';
import ServiceManagerHeader from '../components/serviceManager/ServiceManagerHeader';
import { useAuth } from '../context/AuthContext';
import { LogOut, X } from 'lucide-react';
import '../components/customer/CustomerLayout.css';

export default function ServiceManagerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path.includes('/service-manager/services')) return 'Services Catalog';
    if (path.includes('/service-manager/bookings')) return 'Bookings Management';
    if (path.includes('/service-manager/mechanics')) return 'Mechanic Workload';
    if (path.includes('/service-manager/service-centers')) return 'Service Centers';
    if (path.includes('/service-manager/profile')) return 'Service Manager Profile';
    return 'Service Operations Dashboard';
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="customer-layout-wrapper">
      {/* SIDEBAR */}
      <ServiceManagerSidebar
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

      {/* MAIN CONTENT AREA */}
      <div className="customer-main-content">
        <ServiceManagerHeader
          title={getPageTitle(location.pathname)}
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
              Are you sure you want to logout of the Service Manager Portal?
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
