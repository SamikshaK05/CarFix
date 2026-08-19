import { NavLink } from 'react-router-dom';
import {
  Wrench,
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  User,
  LogOut,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ServiceManagerSidebar({ mobileOpen, onCloseMobile, onOpenLogoutModal }) {
  const { user, logout } = useAuth();

  const handleLogoutClick = () => {
    if (onOpenLogoutModal) {
      onOpenLogoutModal();
    } else {
      logout();
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/service-manager/dashboard', icon: LayoutDashboard },
    { label: 'Services Catalog', path: '/service-manager/services', icon: Wrench },
    { label: 'Bookings Queue', path: '/service-manager/bookings', icon: Calendar },
    { label: 'Mechanic Workload', path: '/service-manager/mechanics', icon: Users },
    { label: 'Service Centers', path: '/service-manager/service-centers', icon: MapPin },
    { label: 'My Profile', path: '/service-manager/profile', icon: User },
  ];

  return (
    <aside className={`customer-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Service Manager Navigation">
      <div className="sidebar-top">
        {/* BRANDING */}
        <div className="sidebar-brand-container">
          <NavLink to="/service-manager/dashboard" className="sidebar-brand" onClick={onCloseMobile}>
            <SlidersHorizontal className="sidebar-brand-icon" size={28} style={{ color: '#8B5CF6' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>CarFix</span>
              <span style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#8B5CF6', fontWeight: 700 }}>
                Service Manager
              </span>
            </div>
          </NavLink>

          {mobileOpen && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onCloseMobile}
              style={{ marginLeft: 'auto', color: 'var(--white)' }}
              aria-label="Close Mobile Sidebar"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) => (isActive ? 'sidebar-nav-item active' : 'sidebar-nav-item')}
                onClick={onCloseMobile}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* USER INFO & LOGOUT */}
      <div className="sidebar-bottom">
        <div style={{ marginBottom: '0.85rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--white)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Service Manager'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Role: {user?.role || 'SERVICE_MANAGER'}
          </span>
        </div>

        <button type="button" className="sidebar-logout-btn" onClick={handleLogoutClick}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
