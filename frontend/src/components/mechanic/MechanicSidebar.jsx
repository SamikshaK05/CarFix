import { NavLink } from 'react-router-dom';
import {
  Wrench,
  LayoutDashboard,
  ClipboardList,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MechanicSidebar({ mobileOpen, onCloseMobile, onOpenLogoutModal }) {
  const { user, logout } = useAuth();

  const handleLogoutClick = () => {
    if (onOpenLogoutModal) {
      onOpenLogoutModal();
    } else {
      logout();
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/mechanic/dashboard', icon: LayoutDashboard },
    { label: 'My Assigned Jobs', path: '/mechanic/jobs', icon: ClipboardList },
    { label: 'My Profile', path: '/mechanic/profile', icon: User },
  ];

  return (
    <aside className={`customer-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Mechanic Sidebar Navigation">
      <div className="sidebar-top">
        {/* BRANDING */}
        <div className="sidebar-brand-container">
          <NavLink to="/mechanic/dashboard" className="sidebar-brand" onClick={onCloseMobile}>
            <Wrench className="sidebar-brand-icon" size={28} style={{ color: '#3B82F6' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>CarFix</span>
              <span style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#3B82F6', fontWeight: 700 }}>
                Mechanic Portal
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
            {user?.name || 'Mechanic'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#3B82F6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Role: {user?.role || 'MECHANIC'}
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
