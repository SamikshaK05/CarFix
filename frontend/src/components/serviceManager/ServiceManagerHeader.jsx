import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ServiceManagerHeader({ title, onOpenMobileMenu }) {
  const { user } = useAuth();

  const managerName = user?.name || 'Service Manager';
  const managerInitials = managerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="customer-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={24} />
        </button>
        <h2 className="header-title">{title || 'Service Manager Workspace'}</h2>
      </div>

      <div className="header-right">
        {/* Service Manager Profile Badge */}
        <div className="user-profile-badge">
          <div className="avatar-circle" style={{ backgroundColor: '#8B5CF6', color: '#ffffff' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={managerName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              managerInitials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="user-name">{managerName}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Operations Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}
