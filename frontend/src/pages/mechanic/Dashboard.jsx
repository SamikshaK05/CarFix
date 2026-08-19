import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Loader2,
  ChevronRight,
  User,
  Car,
  MapPin,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import { getMechanicDashboard } from '../../api/mechanic.api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function MechanicDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMechanicDashboard();
      if (response && response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch mechanic dashboard data');
      }
    } catch (err) {
      console.error('Error loading mechanic dashboard:', err.message);
      setError(err.data?.message || err.message || 'Unable to load mechanic workspace statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Loading mechanic schedule & assigned service jobs...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Mechanic Workspace</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
        <button type="button" className="btn-card-primary" onClick={fetchDashboard} style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}>
          <RefreshCw size={16} style={{ marginRight: '0.4rem' }} /> Try Again
        </button>
      </div>
    );
  }

  const {
    user = {},
    stats = {},
    todaySchedule = [],
    activeJobs = [],
    recentCompletedJobs = [],
  } = dashboardData || {};

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', label: 'Completed' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', label: 'In Progress' };
      case 'CONFIRMED':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563EB', label: 'Confirmed' };
      case 'CANCELLED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', label: 'Cancelled' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706', label: 'Pending' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
            Welcome Back, {user.name || 'Technician'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Manage your service queue, inspect vehicle details, and update job progress.
          </p>
        </div>
        <Link to="/mechanic/jobs" className="btn-card-primary" style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Wrench size={16} /> View All Jobs
        </Link>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="dashboard-stats-grid">
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Assigned Jobs</span>
            <Wrench size={22} color="#3B82F6" />
          </div>
          <strong style={{ fontSize: '1.6rem', color: 'var(--primary-dark)' }}>{stats.totalJobs || 0}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
            Total workload in system
          </span>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Jobs Scheduled Today</span>
            <Calendar size={22} color="#F59E0B" />
          </div>
          <strong style={{ fontSize: '1.6rem', color: '#D97706' }}>{stats.todayJobs || 0}</strong>
          <span style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
            Requiring attention today
          </span>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>In Progress</span>
            <Clock size={22} color="#8B5CF6" />
          </div>
          <strong style={{ fontSize: '1.6rem', color: '#8B5CF6' }}>{stats.inProgressJobs || 0}</strong>
          <span style={{ fontSize: '0.78rem', color: '#8B5CF6', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
            Currently under repair
          </span>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed Jobs</span>
            <CheckCircle2 size={22} color="#10B981" />
          </div>
          <strong style={{ fontSize: '1.6rem', color: '#10B981' }}>{stats.completedJobs || 0}</strong>
          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
            Successfully serviced
          </span>
        </div>
      </div>

      {/* TODAY'S SERVICE SCHEDULE */}
      <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
              Today's Service Appointments
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Service jobs scheduled for today's shift.
            </p>
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', padding: '0.25rem 0.65rem', borderRadius: '20px' }}>
            {todaySchedule.length} Appointments
          </span>
        </div>

        {todaySchedule.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {todaySchedule.map((b) => {
              const badge = getStatusBadgeStyle(b.status);
              const bId = b._id || b.id;
              const customerName = b.user?.name || 'Customer';
              const vehTitle = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : 'Vehicle';
              const regNum = b.vehicle?.registrationNumber || '';
              const srvName = b.service?.name || 'Service';

              return (
                <div key={bId} style={{ backgroundColor: 'var(--bg-light)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        TIME: {b.bookingTime || 'N/A'}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: badge.bg, color: badge.color, padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        {badge.label}
                      </span>
                    </div>

                    <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.2rem' }}>
                      {srvName}
                    </strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Car size={14} color="#3B82F6" /> {vehTitle} {regNum ? `(${regNum})` : ''}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <User size={14} color="var(--primary-accent)" /> {customerName} ({b.user?.phone || 'No phone'})
                    </div>
                  </div>

                  <Link to={`/mechanic/jobs/${bId}`} className="btn-card-secondary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>
                    Inspect & Update <ArrowUpRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-light)', borderRadius: '12px' }}>
            <Calendar size={32} style={{ color: 'var(--text-secondary)', opacity: 0.6, marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600 }}>No appointments scheduled for today.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>Check your active jobs list for upcoming work.</p>
          </div>
        )}
      </div>

      {/* ACTIVE SERVICE JOBS TABLE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
            Active Service Jobs
          </h3>
          <Link to="/mechanic/jobs" style={{ fontSize: '0.85rem', color: '#3B82F6', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Requested Service</th>
                <th>Scheduled Date & Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeJobs.length > 0 ? (
                activeJobs.map((b) => {
                  const bId = b._id || b.id;
                  const badge = getStatusBadgeStyle(b.status);
                  const customerName = b.user?.name || 'Customer';
                  const vehTitle = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : 'Vehicle';
                  const regNum = b.vehicle?.registrationNumber || '';
                  const srvName = b.service?.name || 'Service';

                  return (
                    <tr key={bId}>
                      <td>
                        <strong style={{ color: 'var(--primary-dark)', fontSize: '0.88rem' }}>
                          #{bId.substring(bId.length - 6).toUpperCase()}
                        </strong>
                      </td>
                      <td className="feature-name">
                        {customerName}
                        {b.user?.phone && (
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {b.user.phone}
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
                      <td>
                        {formatDate(b.bookingDate)}
                        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {b.bookingTime || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: badge.bg, color: badge.color, display: 'inline-flex' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link to={`/mechanic/jobs/${bId}`} className="btn-card-primary" style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6', textDecoration: 'none', padding: '0.3rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          Open <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No active service jobs currently assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT COMPLETED JOBS TABLE */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
          Recently Completed Service Jobs
        </h3>
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Completed Service</th>
                <th>Service Center</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCompletedJobs.length > 0 ? (
                recentCompletedJobs.map((b) => {
                  const bId = b._id || b.id;
                  const customerName = b.user?.name || 'Customer';
                  const vehTitle = b.vehicle ? `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() : 'Vehicle';
                  const srvName = b.service?.name || 'Service';
                  const centerName = b.serviceCenter?.name || 'Workshop';

                  return (
                    <tr key={bId}>
                      <td>
                        <strong style={{ color: 'var(--primary-dark)', fontSize: '0.88rem' }}>
                          #{bId.substring(bId.length - 6).toUpperCase()}
                        </strong>
                      </td>
                      <td className="feature-name">{customerName}</td>
                      <td>{vehTitle}</td>
                      <td>{srvName}</td>
                      <td>{centerName}</td>
                      <td>{formatDate(b.bookingDate)}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'inline-flex' }}>
                          Completed
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No completed jobs recorded yet.
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
