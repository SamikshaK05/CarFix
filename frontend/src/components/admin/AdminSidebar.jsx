import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Calendar,
  Wrench,
  MapPin,
  FileText,
  Star,
  Car,
  BarChart3,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ mobileOpen, onCloseMobile, onOpenLogoutModal }) {
  const { user, logout } = useAuth();

  const handleLogoutClick = () => {
    if (onOpenLogoutModal) {
      onOpenLogoutModal();
    } else {
      logout();
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, isConnected: true },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3, isConnected: true },
    { label: 'Users', path: '/admin/users', icon: Users, isConnected: true },
    { label: 'Vehicles', path: '/admin/vehicles', icon: Car, isConnected: true },
    { label: 'Bookings', path: '/admin/bookings', icon: Calendar, isConnected: true },
    { label: 'Services', path: '/admin/services', icon: Wrench, isConnected: true },
    { label: 'Service Centers', path: '/admin/service-centers', icon: MapPin, isConnected: true },
    { label: 'Invoices', path: '/admin/invoices', icon: FileText, isConnected: true },
    { label: 'Reviews', path: '/admin/reviews', icon: Star, isConnected: true },
  ];

  return (
    <aside className={`customer-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Admin Sidebar Navigation">
      <div className="sidebar-top">
        {/* BRANDING */}
        <div className="sidebar-brand-container">
          <NavLink to="/admin/dashboard" className="sidebar-brand" onClick={onCloseMobile}>
            <ShieldCheck className="sidebar-brand-icon" size={28} style={{ color: 'var(--primary-accent)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>CarFix</span>
              <span style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary-accent)', fontWeight: 700 }}>
                Admin Portal
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

            if (item.isConnected) {
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
            }

            return (
              <div
                key={item.label}
                className="sidebar-nav-item"
                style={{ opacity: 0.6, cursor: 'not-allowed', justifyContent: 'space-between' }}
                title={`${item.label} (Module Coming Soon)`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Soon
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* USER INFO & LOGOUT */}
      <div className="sidebar-bottom">
        <div style={{ marginBottom: '0.85rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--white)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Administrator'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--primary-accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Role: {user?.role || 'ADMIN'}
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
