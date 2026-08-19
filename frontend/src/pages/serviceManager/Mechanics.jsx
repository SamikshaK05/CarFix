import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  X,
} from 'lucide-react';
import { getAdminUsers } from '../../api/users.api';
import { getBookings } from '../../api/bookings.api';
import { formatDate } from '../../utils/formatters';

export default function ServiceManagerMechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [viewingMechanic, setViewingMechanic] = useState(null);

  const fetchMechanicWorkloadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, bookingsRes] = await Promise.all([
        getAdminUsers({ role: 'MECHANIC', limit: 100 }),
        getBookings(),
      ]);

      let mechList = [];
      if (usersRes && usersRes.success && Array.isArray(usersRes.users)) {
        mechList = usersRes.users;
      } else if (usersRes && Array.isArray(usersRes.data)) {
        mechList = usersRes.data;
      }
      setMechanics(mechList);

      if (bookingsRes && bookingsRes.success && Array.isArray(bookingsRes.data)) {
        setBookings(bookingsRes.data);
      }
    } catch (err) {
      console.error('Error loading mechanic workload:', err.message);
      setError(err.data?.message || err.message || 'Unable to load mechanics workload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanicWorkloadData();
  }, []);

  // Compute workload for each mechanic
  const mechanicWorkloadMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (b.mechanic) {
        const mId = b.mechanic._id || b.mechanic.id || b.mechanic;
        if (!map[mId]) {
          map[mId] = { total: 0, active: 0, completed: 0, jobs: [] };
        }
        map[mId].total += 1;
        if (b.status === 'COMPLETED') {
          map[mId].completed += 1;
        } else if (['CONFIRMED', 'IN_PROGRESS', 'PENDING'].includes(b.status)) {
          map[mId].active += 1;
        }
        map[mId].jobs.push(b);
      }
    });
    return map;
  }, [bookings]);

  const filteredMechanics = useMemo(() => {
    return mechanics.filter((m) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        (m.phone && m.phone.toLowerCase().includes(term))
      );
    });
  }, [mechanics, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
            Mechanic Team & Workload
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Monitor technician staff, active job assignments, and service throughput.
          </p>
        </div>
        <button type="button" className="btn-card-secondary" onClick={fetchMechanicWorkloadData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} /> Refresh Roster
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: '1', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search mechanics by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* MECHANICS TABLE */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#8B5CF6' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading mechanic staff & active workloads...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Mechanics</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchMechanicWorkloadData} style={{ backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Technician Name</th>
                <th>Contact Phone</th>
                <th>Email</th>
                <th>Active Jobs</th>
                <th>Completed Jobs</th>
                <th>Total Workload</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredMechanics.length > 0 ? (
                filteredMechanics.map((m) => {
                  const mId = m._id || m.id;
                  const workload = mechanicWorkloadMap[mId] || { total: 0, active: 0, completed: 0 };
                  return (
                    <tr key={mId}>
                      <td className="feature-name">
                        <strong style={{ color: 'var(--primary-dark)' }}>{m.name}</strong>
                      </td>
                      <td>{m.phone || 'N/A'}</td>
                      <td>{m.email}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: workload.active > 0 ? '#3B82F6' : 'var(--text-secondary)' }}>
                          {workload.active} Active
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>
                          {workload.completed} Done
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {workload.total} Jobs
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: m.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: m.isActive ? '#10B981' : '#EF4444', display: 'inline-flex' }}>
                          <span className="status-dot"></span>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-card-secondary"
                          onClick={() => setViewingMechanic(m)}
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="View Technician Workload"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    No mechanic accounts found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MECHANIC WORKLOAD MODAL */}
      {viewingMechanic && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} color="#8B5CF6" />
                Technician Workload Profile
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingMechanic(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--primary-dark)', margin: 0 }}>{viewingMechanic.name}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingMechanic.email} • {viewingMechanic.phone}</span>
              </div>

              {(() => {
                const mId = viewingMechanic._id || viewingMechanic.id;
                const workload = mechanicWorkloadMap[mId] || { total: 0, active: 0, completed: 0, jobs: [] };
                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--bg-light)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Active Jobs</span>
                        <strong style={{ display: 'block', fontSize: '1.2rem', color: '#3B82F6' }}>{workload.active}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Completed</span>
                        <strong style={{ display: 'block', fontSize: '1.2rem', color: '#10B981' }}>{workload.completed}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Jobs</span>
                        <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary-dark)' }}>{workload.total}</strong>
                      </div>
                    </div>

                    <h5 style={{ fontSize: '0.95rem', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Assigned Job History</h5>
                    {workload.jobs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {workload.jobs.map((j) => (
                          <div key={j._id || j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '6px', fontSize: '0.85rem' }}>
                            <div>
                              <strong>{j.service?.name || 'Service'}</strong>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Customer: {j.user?.name || 'Customer'}</div>
                            </div>
                            <span className="status-badge" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
                              {j.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>No jobs assigned to this mechanic yet.</p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setViewingMechanic(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
