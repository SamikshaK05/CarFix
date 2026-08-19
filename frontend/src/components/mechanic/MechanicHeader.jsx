import { useState } from 'react';
import { Menu, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MechanicHeader({ title, onOpenMobileMenu }) {
  const { user } = useAuth();

  const mechanicName = user?.name || 'Mechanic';
  const mechanicInitials = mechanicName
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
        <h2 className="header-title">{title || 'Mechanic Portal'}</h2>
      </div>

      <div className="header-right">
        {/* Mechanic Profile Badge */}
        <div className="user-profile-badge">
          <div className="avatar-circle" style={{ backgroundColor: '#3B82F6', color: '#ffffff' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={mechanicName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              mechanicInitials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="user-name">{mechanicName}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Technician</span>
          </div>
        </div>
      </div>
    </header>
  );
}
