import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../components/customer/CustomerLayout.css';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getAdminPageTitle = (path) => {
    if (path.includes('/admin/reports')) return 'Reports & Analytics';
    if (path.includes('/admin/users')) return 'User Management';
    if (path.includes('/admin/vehicles')) return 'Vehicle Directory';
    if (path.includes('/admin/bookings')) return 'Booking Management';
    if (path.includes('/admin/services')) return 'Services Catalog';
    if (path.includes('/admin/service-centers')) return 'Service Centers';
    if (path.includes('/admin/invoices')) return 'Invoices & Billing';
    if (path.includes('/admin/reviews')) return 'Customer Reviews';
    return 'Admin Dashboard';
  };

  return (
    <div className="customer-layout-wrapper">
      {/* FIXED / MOBILE ADMIN SIDEBAR */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MAIN ADMIN CONTENT CONTAINER */}
      <div className="customer-main-content">
        <AdminHeader
          title={getAdminPageTitle(location.pathname)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="customer-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
