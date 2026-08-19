import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Helper function to map user role to dashboard route
export const getDashboardPath = (role) => {
  switch (role) {
    case 'CUSTOMER':
      return '/customer/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'SERVICE_MANAGER':
      return '/service-manager/dashboard';
    case 'MECHANIC':
      return '/mechanic/dashboard';
    default:
      return '/login';
  }
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated, logout } = useAuth();

  // A. Do not redirect while authentication check is loading
  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p style={{ marginTop: '0.5rem', color: '#666' }}>Verifying authentication status</p>
      </div>
    );
  }

  // B. If user is not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Handle invalid/unknown user roles safely
  const validRoles = ['CUSTOMER', 'ADMIN', 'SERVICE_MANAGER', 'MECHANIC'];
  if (!validRoles.includes(user.role)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  // C. If allowedRoles provided and user's role is not included, redirect to role's dashboard
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    const targetDashboard = getDashboardPath(user.role);
    return <Navigate to={targetDashboard} replace />;
  }

  // D. Authenticated and role is allowed
  return children;
}
