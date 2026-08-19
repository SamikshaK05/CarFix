import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  MapPin,
  CalendarPlus,
  History,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { getCustomerDashboard } from '../../api/customer.api';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCustomerDashboard();
      if (response && response.success && response.data) {
        setDashData(response.data);
      } else {
        throw new Error('Failed to parse dashboard data');
      }
    } catch (err) {
      console.error('Error fetching customer dashboard:', err.message);
      setError(err.data?.message || err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Determine greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Loader2 size={40} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
        <h3 style={{ marginTop: '1rem', color: 'var(--primary-dark)' }}>Loading Customer Dashboard...</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Fetching live vehicle metrics and service history</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Failed to Load Dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
        <button type="button" className="btn-card-primary" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  const userProfile = dashData?.user || authUser || {};
  const stats = dashData?.stats || {};
  const upcomingList = dashData?.upcomingBookings || [];
  const recentBookings = dashData?.recentBookings || [];
  const firstUpcoming = upcomingList.length > 0 ? upcomingList[0] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* GREETING HEADER */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.3rem' }}>
          {getGreeting()}, {userProfile.name || 'Valued Customer'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Here's a live overview of your vehicles, bookings, and invoices.
        </p>
      </div>

      {/* STATS CARDS GRID */}
      <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="info-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div className="info-icon-wrapper">
            <Car size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>My Cars</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-dark)' }}>{stats.totalVehicles ?? dashData?.totalVehicles ?? 0}</h3>
          </div>
        </div>

        <div className="info-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div className="info-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Active Bookings</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-dark)' }}>{stats.activeBookings ?? dashData?.activeBookings ?? 0}</h3>
          </div>
        </div>

        <div className="info-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div className="info-icon-wrapper">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Completed Services</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-dark)' }}>{stats.completedServices ?? stats.completedBookings ?? dashData?.completedServices ?? 0}</h3>
          </div>
        </div>

        <div className="info-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div className="info-icon-wrapper">
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Pending Invoices</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: stats.pendingInvoices > 0 ? '#ef4444' : 'var(--primary-dark)' }}>
              {stats.pendingInvoices ?? dashData?.pendingInvoices ?? 0}
            </h3>
          </div>
        </div>
      </div>

      {/* UPCOMING SERVICE HIGHLIGHTED CARD */}
      <div
        style={{
          backgroundColor: 'var(--white)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
            Upcoming Service
          </h3>
          {firstUpcoming && (
            <span className="status-badge">
              <span className="status-dot"></span>
              {firstUpcoming.status}
            </span>
          )}
        </div>

        {firstUpcoming ? (
          <>
            <div className="upcoming-details-grid">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Vehicle</span>
                <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>
                  {firstUpcoming.vehicle ? `${firstUpcoming.vehicle.make} ${firstUpcoming.vehicle.model}` : 'Registered Vehicle'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>
                  ({firstUpcoming.vehicle?.registrationNumber || 'N/A'})
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Service</span>
                <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>
                  {firstUpcoming.service?.name || 'General Service'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Service Center</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} color="var(--primary-accent)" />
                  {firstUpcoming.serviceCenter?.name || 'CarFix Workshop'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Date & Time</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={14} color="var(--primary-accent)" />
                  {new Date(firstUpcoming.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {firstUpcoming.bookingTime}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Link to="/customer/bookings" className="btn-card-secondary" style={{ textDecoration: 'none' }}>
                View All Bookings
              </Link>
              <Link to="/customer/book-service" className="btn-card-primary" style={{ textDecoration: 'none' }}>
                Book Another Service
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>No upcoming services scheduled right now.</p>
            <Link to="/customer/book-service" className="btn-card-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <CalendarPlus size={18} /> Schedule Service Now
            </Link>
          </div>
        )}
      </div>

      {/* RECENT SERVICE HISTORY TABLE */}
      <div
        style={{
          backgroundColor: 'var(--white)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
            Recent Service History
          </h3>
          <Link to="/customer/service-history" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-accent)' }}>
            View All History →
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <div className="table-responsive-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((row) => (
                  <tr key={row._id || row.id}>
                    <td className="feature-name">
                      {row.vehicle ? `${row.vehicle.make} ${row.vehicle.model}` : 'Vehicle'}
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                        {row.vehicle?.registrationNumber || ''}
                      </span>
                    </td>
                    <td>{row.service?.name || 'Service'}</td>
                    <td>{new Date(row.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ fontWeight: '700' }}>₹{row.amount}</td>
                    <td>
                      <span className="status-badge" style={{ display: 'inline-flex' }}>
                        <span className="status-dot"></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-secondary)' }}>
            <p>No previous service history recorded yet.</p>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
          Quick Actions
        </h3>
        <div className="quick-actions-grid">
          <div className="support-card">
            <div>
              <div className="support-icon">
                <CalendarPlus size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--primary-dark)', marginTop: '1rem' }}>
                Book a Service
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Schedule your next vehicle service.
              </p>
            </div>
            <Link to="/customer/book-service" className="btn-card-primary" style={{ textAlign: 'center' }}>
              Book Now <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
            </Link>
          </div>

          <div className="support-card">
            <div>
              <div className="support-icon">
                <Car size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--primary-dark)', marginTop: '1rem' }}>
                My Cars
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Manage your registered vehicles.
              </p>
            </div>
            <Link to="/customer/cars" className="btn-card-secondary" style={{ textAlign: 'center' }}>
              Manage Cars
            </Link>
          </div>

          <div className="support-card">
            <div>
              <div className="support-icon">
                <History size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--primary-dark)', marginTop: '1rem' }}>
                Service History
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                View your previous services.
              </p>
            </div>
            <Link to="/customer/service-history" className="btn-card-secondary" style={{ textAlign: 'center' }}>
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
