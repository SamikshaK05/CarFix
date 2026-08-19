import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import apiClient from './api/client';
import MainLayout from './layouts/MainLayout';

import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import ServiceCenters from './pages/ServiceCenters';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import CustomerLayout from './components/customer/CustomerLayout';
import Dashboard from './pages/customer/Dashboard';
import MyCars from './pages/customer/MyCars';
import BookService from './pages/customer/BookService';
import MyBookings from './pages/customer/MyBookings';
import ServiceHistory from './pages/customer/ServiceHistory';
import Invoices from './pages/customer/Invoices';
import Profile from './pages/customer/Profile';

import AdminLayout from './layouts/AdminLayout';
import MechanicLayout from './layouts/MechanicLayout';
import ServiceManagerLayout from './layouts/ServiceManagerLayout';

// Lazy-loaded Admin Page Modules for Route-Level Code Splitting
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminBookings = lazy(() => import('./pages/admin/Bookings'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminServiceCenters = lazy(() => import('./pages/admin/ServiceCenters'));
const AdminInvoices = lazy(() => import('./pages/admin/Invoices'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminVehicles = lazy(() => import('./pages/admin/Vehicles'));

// Lazy-loaded Mechanic Page Modules for Route-Level Code Splitting
const MechanicDashboard = lazy(() => import('./pages/mechanic/Dashboard'));
const MechanicJobs = lazy(() => import('./pages/mechanic/Jobs'));
const MechanicJobDetails = lazy(() => import('./pages/mechanic/JobDetails'));
const MechanicProfile = lazy(() => import('./pages/mechanic/Profile'));

// Lazy-loaded Service Manager Page Modules for Route-Level Code Splitting
const ServiceManagerDashboard = lazy(() => import('./pages/serviceManager/Dashboard'));
const ServiceManagerServices = lazy(() => import('./pages/serviceManager/Services'));
const ServiceManagerBookings = lazy(() => import('./pages/serviceManager/Bookings'));
const ServiceManagerMechanics = lazy(() => import('./pages/serviceManager/Mechanics'));
const ServiceManagerServiceCenter = lazy(() => import('./pages/serviceManager/ServiceCenter'));
const ServiceManagerProfile = lazy(() => import('./pages/serviceManager/Profile'));

import ProtectedRoute from './components/ProtectedRoute';

// Temporary API connection test using central apiClient
function testBackendConnection() {
  console.log('Frontend API Base URL:', import.meta.env.VITE_API_URL);

  apiClient
    .get('/health')
    .then((data) => {
      console.log('Central apiClient GET /health successful:', data);
    })
    .catch((error) => {
      console.error('Central apiClient GET /health failed:', error);
    });
}

function AdminLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', flexDirection: 'column', gap: '1rem' }}>
      <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
      <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading Admin Module...</span>
    </div>
  );
}

function MechanicLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', flexDirection: 'column', gap: '1rem' }}>
      <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
      <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading Mechanic Workspace...</span>
    </div>
  );
}

function ServiceManagerLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', flexDirection: 'column', gap: '1rem' }}>
      <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#8B5CF6' }} />
      <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading Service Manager Workspace...</span>
    </div>
  );
}

function TermsPlaceholder() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Terms & Conditions</h1>
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
        CarFix platform terms and conditions preview document.
      </p>
    </div>
  );
}

function PrivacyPlaceholder() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Privacy Policy</h1>
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
        CarFix platform privacy policy preview document.
      </p>
    </div>
  );
}

function App() {
  // Test connection between React frontend and Node/Express backend
  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            MAIN APPLICATION ROUTES
        ========================== */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route path="centers" element={<ServiceCenters />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<TermsPlaceholder />} />
          <Route path="privacy" element={<PrivacyPlaceholder />} />
        </Route>

        {/* =========================
            AUTHENTICATION ROUTES
        ========================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* =========================
            CUSTOMER ROUTES
        ========================== */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cars" element={<MyCars />} />
          <Route path="book-service" element={<BookService />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="service-history" element={<ServiceHistory />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* =========================
            ADMIN ROUTES (LAZY LOADED CHUNKS)
        ========================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<AdminLoadingFallback />}><AdminDashboard /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<AdminLoadingFallback />}><AdminReports /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<AdminLoadingFallback />}><AdminUsers /></Suspense>} />
          <Route path="vehicles" element={<Suspense fallback={<AdminLoadingFallback />}><AdminVehicles /></Suspense>} />
          <Route path="bookings" element={<Suspense fallback={<AdminLoadingFallback />}><AdminBookings /></Suspense>} />
          <Route path="services" element={<Suspense fallback={<AdminLoadingFallback />}><AdminServices /></Suspense>} />
          <Route path="service-centers" element={<Suspense fallback={<AdminLoadingFallback />}><AdminServiceCenters /></Suspense>} />
          <Route path="invoices" element={<Suspense fallback={<AdminLoadingFallback />}><AdminInvoices /></Suspense>} />
          <Route path="reviews" element={<Suspense fallback={<AdminLoadingFallback />}><AdminReviews /></Suspense>} />
        </Route>

        {/* =========================
            MECHANIC ROUTES (LAZY LOADED CHUNKS)
        ========================== */}
        <Route
          path="/mechanic"
          element={
            <ProtectedRoute allowedRoles={['MECHANIC']}>
              <MechanicLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<MechanicLoadingFallback />}><MechanicDashboard /></Suspense>} />
          <Route path="jobs" element={<Suspense fallback={<MechanicLoadingFallback />}><MechanicJobs /></Suspense>} />
          <Route path="jobs/:id" element={<Suspense fallback={<MechanicLoadingFallback />}><MechanicJobDetails /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<MechanicLoadingFallback />}><MechanicProfile /></Suspense>} />
        </Route>

        {/* =========================
            SERVICE MANAGER ROUTES (LAZY LOADED CHUNKS)
        ========================== */}
        <Route
          path="/service-manager"
          element={
            <ProtectedRoute allowedRoles={['SERVICE_MANAGER']}>
              <ServiceManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<ServiceManagerLoadingFallback />}><ServiceManagerDashboard /></Suspense>} />
          <Route path="services" element={<Suspense fallback={<ServiceManagerLoadingFallback />}><ServiceManagerServices /></Suspense>} />
          <Route path="bookings" element={<Suspense fallback={<ServiceManagerLoadingFallback />}><ServiceManagerBookings /></Suspense>} />
          <Route path="mechanics" element={<Suspense fallback={<ServiceManagerLoadingFallback />}><ServiceManagerMechanics /></Suspense>} />
          <Route path="service-centers" element={<Suspense fallback={<ServiceManagerLoadingFallback />}><ServiceManagerServiceCenter /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<ServiceManagerLoadingFallback />}><ServiceManagerProfile /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;