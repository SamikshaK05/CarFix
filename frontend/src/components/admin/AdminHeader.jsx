import { useNavigate } from 'react';
import { Menu, ShieldCheck, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminHeader({ title = 'Admin Dashboard', onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error logging out:', err);
      navigate('/login', { replace: true });
    }
  };

  const adminName = user?.name || 'Administrator';
  const adminRole = user?.role || 'ADMIN';
  const avatarInitial = adminName.charAt(0).toUpperCase() || 'A';

  return (
    <header className="customer-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          title="Toggle Navigation Menu"
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={22} color="var(--primary-accent)" />
          <h2 className="header-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
            {title}
          </h2>
        </div>
      </div>

      <div className="header-right" style={{ gap: '1.25rem' }}>
        {/* ADMIN PROFILE BADGE */}
        <div className="user-profile-badge" style={{ gap: '0.65rem' }}>
          <div
            className="avatar-circle"
            style={{
              backgroundColor: 'var(--primary-dark)',
              color: 'var(--primary-accent)',
              border: '1.5px solid var(--primary-accent)',
              fontSize: '1rem',
              fontWeight: 800,
            }}
          >
            {avatarInitial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.25' }}>
            <span className="user-name" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
              {adminName}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-accent)', letterSpacing: '0.5px' }}>
              {adminRole}
            </span>
          </div>
        </div>

        {/* QUICK LOGOUT BUTTON */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout of admin portal"
          title="Sign Out"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#DC2626',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          <LogOut size={16} />
          <span style={{ display: 'inline' }}>Logout</span>
        </button>
      </div>
    </header>
  );
}
