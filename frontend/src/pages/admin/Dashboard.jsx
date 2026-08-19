import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Wrench,
  Car,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Star,
  Loader2,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { getAdminDashboard } from '../../api/admin.api';
import { formatCurrency } from '../../utils/formatters';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminDashboard();
      if (response && response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch admin dashboard data');
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err.message);
      setError(err.data?.message || err.message || 'Unable to load admin dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading system statistics & platform analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Admin Dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
        <button type="button" className="btn-card-primary" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  const {
    stats = {},
    recentUsers = [],
    recentBookings = [],
    recentInvoices = [],
    recentReviews = [],
    serviceCenters = [],
  } = dashboardData || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* PAGE HEADING */}
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Overview of your CarFix platform operations, live statistics, and system metrics.
        </p>
      </div>

      {/* STATISTICAL OVERVIEW GROUPS */}

      {/* GROUP 1: SYSTEM OVERVIEW & USERS */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
          System Users & Accounts
        </h3>
        <div className="dashboard-stats-grid">
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Users</span>
              <Users size={22} color="var(--primary-accent)" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalUsers || 0}</strong>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Customers</span>
              <UserCheck size={22} color="#10B981" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalCustomers || 0}</strong>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mechanics</span>
              <Wrench size={22} color="#3B82F6" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalMechanics || 0}</strong>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Managers & Admins</span>
              <ShieldCheck size={22} color="#8B5CF6" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>
              {(stats.totalServiceManagers || 0) + (stats.totalAdmins || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* GROUP 2: SERVICES & CENTERS */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
          Catalog & Service Centers
        </h3>
        <div className="dashboard-stats-grid">
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Services</span>
              <Car size={22} color="var(--primary-accent)" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalServices || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'block', marginTop: '0.25rem' }}>
              {stats.activeServices || 0} Active
            </span>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Service Centers</span>
              <MapPin size={22} color="#F59E0B" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalServiceCenters || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'block', marginTop: '0.25rem' }}>
              {stats.activeServiceCenters || 0} Operational
            </span>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Vehicles</span>
              <Car size={22} color="#6366F1" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalVehicles || 0}</strong>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Customer Reviews</span>
              <Star size={22} color="#F59E0B" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalReviews || 0}</strong>
          </div>
        </div>
      </div>

      {/* GROUP 3: BOOKINGS & FINANCIAL METRICS */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
          Appointments & Billing Metrics
        </h3>
        <div className="dashboard-stats-grid">
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Bookings</span>
              <Calendar size={22} color="var(--primary-accent)" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalBookings || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              {stats.pendingBookings || 0} Pending | {stats.confirmedBookings || 0} Confirmed
            </span>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completed Bookings</span>
              <CheckCircle2 size={22} color="#10B981" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.completedBookings || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: '#EF4444', display: 'block', marginTop: '0.25rem' }}>
              {stats.cancelledBookings || 0} Cancelled
            </span>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Invoices</span>
              <FileText size={22} color="#3B82F6" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalInvoices || 0}</strong>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paid Invoices</span>
              <CreditCard size={22} color="#10B981" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.paidInvoices || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: '#F59E0B', display: 'block', marginTop: '0.25rem' }}>
              {stats.pendingPayments || 0} Pending Payments
            </span>
          </div>
        </div>
      </div>

      {/* RECENT BOOKINGS TABLE */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
          Recent Service Bookings
        </h3>
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Service Center</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length > 0 ? (
                recentBookings.map((b) => {
                  const bId = b._id || b.id;
                  const customerName = b.user?.name || 'Customer';
                  const customerPhone = b.user?.phone || b.user?.email || '';
                  const vehTitle = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : 'Vehicle';
                  const regNum = b.vehicle?.registrationNumber || '';
                  const srvName = b.service?.name || 'Service';
                  const centerName = b.serviceCenter?.name || 'Workshop';
                  const dateStr = b.bookingDate
                    ? new Date(b.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '';

                  return (
                    <tr key={bId}>
                      <td className="feature-name">
                        {customerName}
                        {customerPhone && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {customerPhone}
                          </span>
                        )}
                      </td>
                      <td>
                        {vehTitle}
                        {regNum && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {regNum}
                          </span>
                        )}
                      </td>
                      <td>{srvName}</td>
                      <td>{centerName}</td>
                      <td>
                        {dateStr} ({b.bookingTime || 'N/A'})
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(b.service?.price || b.amount || 0)}</td>
                      <td>
                        <span className="status-badge" style={{ display: 'inline-flex' }}>
                          <span className="status-dot"></span>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No recent bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT INVOICES & USERS GRID */}
      <div className="profile-grid">
        {/* RECENT INVOICES */}
        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
            Recent Invoices
          </h3>
          {recentInvoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentInvoices.map((inv) => (
                <div key={inv._id || inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '10px', fontSize: '0.9rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>
                      {inv.invoiceNumber}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {inv.user?.name || 'Customer'} • {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--primary-accent)', display: 'block' }}>{formatCurrency(inv.total)}</strong>
                    <span className="status-badge" style={{ display: 'inline-flex', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>No recent invoices found.</p>
          )}
        </div>

        {/* RECENT USERS */}
        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
            Recently Registered Users
          </h3>
          {recentUsers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentUsers.map((u) => (
                <div key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '10px', fontSize: '0.9rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>
                      {u.name || 'User'}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {u.email} ({u.phone || 'No phone'})
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: u.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: u.role === 'ADMIN' ? '#8B5CF6' : '#10B981',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                    }}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>No recent users found.</p>
          )}
        </div>
      </div>

      {/* SERVICE CENTERS OVERVIEW TABLE */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
          Network Service Centers
        </h3>
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Center Name</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Rating</th>
                <th>Total Reviews</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {serviceCenters.length > 0 ? (
                serviceCenters.map((sc) => (
                  <tr key={sc._id || sc.id}>
                    <td className="feature-name">{sc.name}</td>
                    <td>{sc.city}{sc.state ? `, ${sc.state}` : ''}</td>
                    <td>{sc.phone || 'N/A'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700, color: '#F59E0B' }}>
                        <Star size={14} fill="#F59E0B" /> {sc.rating || 0}
                      </span>
                    </td>
                    <td>{sc.totalReviews || 0} reviews</td>
                    <td>
                      <span className="status-badge" style={{ display: 'inline-flex' }}>
                        <span className="status-dot"></span>
                        {sc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No service centers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
