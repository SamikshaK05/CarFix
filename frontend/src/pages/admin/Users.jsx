import { useState, useEffect, useCallback } from 'react';
import {
  Users as UsersIcon,
  Search,
  Eye,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wrench,
  User,
  RefreshCw,
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  updateAdminUserStatus,
  deleteAdminUser,
} from '../../api/users.api';

export default function AdminUsers() {
  // Main list state & filters
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [viewingUser, setViewingUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', role: 'CUSTOMER', avatar: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [confirmStatusUser, setConfirmStatusUser] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminUsers({
        search,
        role,
        isActive: isActiveFilter,
        page,
        limit,
      });

      if (response && response.success) {
        setUsers(response.data || []);
        setTotal(response.total || 0);
        setTotalPages(response.pages || 1);
      } else {
        throw new Error(response?.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError(err.data?.message || err.message || 'Unable to load users list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, role, isActiveFilter, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page to 1 when filters change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setIsActiveFilter(e.target.value);
    setPage(1);
  };

  // View User Modal Handler
  const handleOpenViewModal = async (userId) => {
    try {
      setViewLoading(true);
      setViewingUser(null);
      const res = await getAdminUserById(userId);
      if (res && res.success && res.data) {
        setViewingUser(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch user details');
      }
    } catch (err) {
      console.error('Error viewing user:', err);
      alert(err.data?.message || err.message || 'Could not load user details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Edit User Modal Handler
  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setEditFormData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'CUSTOMER',
      avatar: u.avatar || '',
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditLoading(true);
      setEditError(null);
      const res = await updateAdminUser(editingUser._id || editingUser.id, editFormData);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `User ${res.data?.name || ''} updated successfully.` });
        setEditingUser(null);
        fetchUsers();
      } else {
        throw new Error(res?.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setEditError(err.data?.message || err.message || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle Status Handler
  const handleToggleStatus = async () => {
    if (!confirmStatusUser) return;
    const uId = confirmStatusUser._id || confirmStatusUser.id;
    const nextStatus = !confirmStatusUser.isActive;
    try {
      setStatusLoading(true);
      const res = await updateAdminUserStatus(uId, nextStatus);
      if (res && res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Account for ${confirmStatusUser.name} ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
        });
        setConfirmStatusUser(null);
        fetchUsers();
      } else {
        throw new Error(res?.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(err.data?.message || err.message || 'Status update failed.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    const uId = confirmDeleteUser._id || confirmDeleteUser.id;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const res = await deleteAdminUser(uId);
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: `User ${confirmDeleteUser.name} deleted successfully.` });
        setConfirmDeleteUser(null);
        fetchUsers();
      } else {
        throw new Error(res?.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteError(err.data?.message || err.message || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadgeColor = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' };
      case 'SERVICE_MANAGER':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' };
      case 'MECHANIC':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <UsersIcon size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              User Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Manage platform customers, mechanics, service managers, and administrators.
          </p>
        </div>

        <button
          type="button"
          className="btn-card-secondary"
          onClick={fetchUsers}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
        >
          <RefreshCw size={16} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedbackMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: feedbackMsg.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH CARD */}
      <div className="search-filter-card" style={{ padding: '1.25rem', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
        <div className="search-filter-grid">
          {/* SEARCH INPUT */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={handleSearchChange}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* ROLE DROPDOWN */}
          <select className="form-control" value={role} onChange={handleRoleChange}>
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="MECHANIC">Mechanic</option>
            <option value="SERVICE_MANAGER">Service Manager</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* STATUS DROPDOWN */}
          <select className="form-control" value={isActiveFilter} onChange={handleStatusFilterChange}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* SUMMARY METRIC STRIP */}
      <div className="dashboard-stats-grid">
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Accounts</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{total}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Current Page Records</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{users.length}</strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Current Page Active</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#10B981', marginTop: '0.2rem' }}>
            {users.filter((u) => u.isActive).length}
          </strong>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Pages</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-accent)', marginTop: '0.2rem' }}>{totalPages}</strong>
        </div>
      </div>

      {/* MAIN USERS TABLE SECTION */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching user accounts...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load Users</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchUsers}>
            Try Again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <UsersIcon size={40} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>No Users Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {search || role || isActiveFilter !== ''
              ? 'No user accounts match your current filter parameters.'
              : 'There are currently no registered user accounts in the platform.'}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-responsive-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const uId = u._id || u.id;
                  const initial = u.name ? u.name.charAt(0).toUpperCase() : 'U';
                  const badgeStyle = getRoleBadgeColor(u.role);

                  return (
                    <tr key={uId}>
                      <td className="feature-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            className="avatar-circle"
                            style={{
                              width: '36px',
                              height: '36px',
                              fontSize: '0.9rem',
                              backgroundColor: 'var(--primary-dark)',
                              color: 'var(--primary-accent)',
                              border: '1px solid var(--primary-accent)',
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--primary-dark)', display: 'block' }}>{u.name || 'Unnamed User'}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || 'N/A'}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.color,
                            display: 'inline-block',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ display: 'inline-flex' }}>
                          <span className="status-dot" style={{ backgroundColor: u.isActive ? '#10B981' : '#EF4444' }}></span>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          {/* VIEW BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="View User Details"
                            onClick={() => handleOpenViewModal(uId)}
                          >
                            <Eye size={16} />
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit User Info & Role"
                            onClick={() => handleOpenEditModal(u)}
                          >
                            <Edit3 size={16} />
                          </button>

                          {/* TOGGLE STATUS BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title={u.isActive ? 'Deactivate User' : 'Activate User'}
                            onClick={() => setConfirmStatusUser(u)}
                            style={{ color: u.isActive ? '#DC2626' : '#16A34A' }}
                          >
                            {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Delete User"
                            onClick={() => {
                              setConfirmDeleteUser(u);
                              setDeleteError(null);
                            }}
                            style={{ color: '#DC2626' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION BAR */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-light)',
            }}
          >
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total users)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-card-secondary"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                style={{ padding: '0.4rem 0.85rem', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                className="btn-card-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                style={{ padding: '0.4rem 0.85rem', opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW USER MODAL */}
      {(viewingUser || viewLoading) && (
        <div className="modal-overlay" onClick={() => setViewingUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">User Account Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewingUser(null)}>
                <X size={20} />
              </button>
            </div>

            {viewLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="avatar-circle" style={{ width: '48px', height: '48px', fontSize: '1.2rem', backgroundColor: 'var(--primary-dark)', color: 'var(--primary-accent)' }}>
                    {viewingUser.name ? viewingUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{viewingUser.name}</h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>ID: {viewingUser._id}</span>
                  </div>
                </div>

                <div className="car-info-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div><strong>Email:</strong> {viewingUser.email}</div>
                  <div><strong>Phone:</strong> {viewingUser.phone || 'N/A'}</div>
                  <div><strong>Role:</strong> <span style={{ fontWeight: 700, color: getRoleBadgeColor(viewingUser.role).color }}>{viewingUser.role}</span></div>
                  <div><strong>Status:</strong> {viewingUser.isActive ? 'Active' : 'Inactive'}</div>
                  <div><strong>Joined Date:</strong> {new Date(viewingUser.createdAt).toLocaleString('en-IN')}</div>
                  {viewingUser.updatedAt && <div><strong>Last Updated:</strong> {new Date(viewingUser.updatedAt).toLocaleString('en-IN')}</div>}
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button type="button" className="btn-card-secondary" onClick={() => setViewingUser(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit User Account</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditingUser(null)}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>User Role *</label>
                <select
                  className="form-control"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="MECHANIC">MECHANIC</option>
                  <option value="SERVICE_MANAGER">SERVICE_MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-card-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-card-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS CHANGE MODAL */}
      {confirmStatusUser && (
        <div className="modal-overlay" onClick={() => setConfirmStatusUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {confirmStatusUser.isActive ? 'Deactivate User Account' : 'Activate User Account'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmStatusUser(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to {confirmStatusUser.isActive ? 'deactivate' : 'activate'} account for{' '}
              <strong>{confirmStatusUser.name}</strong> ({confirmStatusUser.email})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmStatusUser(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ backgroundColor: confirmStatusUser.isActive ? '#DC2626' : '#16A34A', borderColor: confirmStatusUser.isActive ? '#DC2626' : '#16A34A' }}
                disabled={statusLoading}
                onClick={handleToggleStatus}
              >
                {statusLoading ? 'Updating...' : confirmStatusUser.isActive ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteUser && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#DC2626' }}>Delete User Account</h3>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmDeleteUser(null)}>
                <X size={20} />
              </button>
            </div>

            {deleteError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem' }}>
                {deleteError}
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Are you sure you want to delete user account <strong>{confirmDeleteUser.name}</strong> ({confirmDeleteUser.email})?
            </p>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', marginTop: '0.4rem' }}>
              Note: Users with associated vehicles, bookings, invoices, or reviews cannot be deleted and must be deactivated instead.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-card-secondary" onClick={() => setConfirmDeleteUser(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                disabled={deleteLoading}
                onClick={handleDeleteUser}
              >
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
