import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Star,
  FileText,
  CreditCard,
  Building,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { getServiceManagerDashboard } from '../../api/serviceManager.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ServiceManagerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServiceManagerDashboard();
      if (response && response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch dashboard metrics');
      }
    } catch (err) {
      console.error('Error loading service manager dashboard:', err.message);
      setError(err.data?.message || err.message || 'Unable to load service manager workspace.');
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
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#8B5CF6' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Loading service operations dashboard & metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
        <button type="button" className="btn-card-primary" onClick={fetchDashboardData} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
          <RefreshCw size={16} style={{ marginRight: '0.4rem' }} /> Try Again
        </button>
      </div>
    );
  }

  const {
    stats = {},
    serviceCenters = [],
    upcomingBookings = [],
    recentBookings = [],
    recentInvoices = [],
    recentReviews = [],
  } = dashboardData || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
            Service Manager Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Monitor service center operations, appointments schedule, catalog availability, and workload.
          </p>
        </div>
        <button type="button" className="btn-card-secondary" onClick={fetchDashboardData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* STATS OVERVIEW GRID */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
          Service Operations Overview
        </h3>
        <div className="dashboard-stats-grid">
          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Bookings</span>
              <Clock size={22} color="#F59E0B" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: '#D97706' }}>{stats.pendingBookings || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              Awaiting Confirmation / Dispatch
            </span>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Service Queue</span>
              <Calendar size={22} color="#3B82F6" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: '#2563EB' }}>{(stats.confirmedBookings || 0) + (stats.inProgressBookings || 0)}</strong>
            <span style={{ fontSize: '0.78rem', color: '#8B5CF6', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
              {stats.confirmedBookings || 0} Confirmed • {stats.inProgressBookings || 0} In Progress
            </span>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed Services</span>
              <CheckCircle2 size={22} color="#10B981" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: '#10B981' }}>{stats.completedBookings || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
              Service Invoices Generated
            </span>
          </div>

          <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Invoices & Payments</span>
              <FileText size={22} color="#8B5CF6" />
            </div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalInvoices || 0}</strong>
            <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
              {stats.paidInvoices || 0} Paid • {stats.pendingPayments || 0} Pending
            </span>
          </div>
        </div>
      </div>

      {/* UPCOMING & RECENT BOOKINGS GRID */}
      <div className="profile-grid">
        {/* UPCOMING BOOKINGS */}
        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
              Upcoming Service Schedule
            </h3>
            <Link to="/service-manager/bookings" style={{ fontSize: '0.85rem', color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}>
              View Queue →
            </Link>
          </div>
          {upcomingBookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {upcomingBookings.map((b) => (
                <div key={b._id || b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '10px', fontSize: '0.9rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>
                      {b.service?.name || 'Service'}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {b.user?.name || 'Customer'} • {formatDate(b.bookingDate)} ({b.bookingTime || 'N/A'})
                    </span>
                  </div>
                  <span className="status-badge" style={{ display: 'inline-flex', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>No upcoming bookings scheduled.</p>
          )}
        </div>

        {/* RECENT INVOICES / BILLING METRICS */}
        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
              Recent Invoices & Payments
            </h3>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10B981' }}>
              {stats.paidInvoices || 0} Paid / {stats.totalInvoices || 0} Total
            </span>
          </div>
          {recentInvoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentInvoices.map((inv) => (
                <div key={inv._id || inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '10px', fontSize: '0.9rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>
                      {inv.invoiceNumber}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {inv.user?.name || 'Customer'} • {formatDate(inv.issuedAt)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#8B5CF6', display: 'block' }}>{formatCurrency(inv.total)}</strong>
                    <span className="status-badge" style={{ display: 'inline-flex', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>No recent invoice records found.</p>
          )}
        </div>
      </div>

      {/* SERVICE CENTERS OVERVIEW */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
            Service Centers Directory
          </h3>
          <Link to="/service-manager/service-centers" style={{ fontSize: '0.85rem', color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}>
            Manage Service Centers →
          </Link>
        </div>
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Center Name</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Rating</th>
                <th>Reviews</th>
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
                    No service centers registered.
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
