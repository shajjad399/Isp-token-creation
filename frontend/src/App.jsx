// ============================================================
// frontend/src/App.jsx
// ============================================================
// Description: Enterprise-grade Application Router
// Version: 2.0.0
// ============================================================

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// ============================================================
// ✅ PERFORMANCE OPTIMIZATION - Lazy Loading
// ============================================================

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailPending from './pages/VerifyEmailPending';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// User Pages
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import Profile from './pages/Profile';
import LiveChat from './pages/LiveChat';
// ✅ Billing & Payments — notun add kora hoyeche (Billing Step 1)
import Billing from './pages/Billing';

// Admin Pages (Lazy Loaded for performance)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAddUser = lazy(() => import('./pages/admin/AdminAddUser'));
const AdminEditUser = lazy(() => import('./pages/admin/AdminEditUser'));

// ============================================================
// ✅ LAYOUT COMPONENTS
// ============================================================

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import ChatWidget from './components/chat/ChatWidget';
import Loader from './components/common/Loader';

// ============================================================
// ✅ LOADING COMPONENT — now a shared, premium, reusable component
// (see src/components/common/Loader.jsx)
// ============================================================

// ============================================================
// ✅ ROUTE GUARDS - Professional Level
// ============================================================

/**
 * Admin Route Guard
 * Only allows users with 'admin' role
 */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    console.log('🔒 AdminRoute: No user, redirecting to admin login');
    return <Navigate to="/admin/login" replace />;
  }
  
  if (user.role !== 'admin') {
    console.log('🔒 AdminRoute: User is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

/**
 * Protected Route Guard
 * Requires authentication for access
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    console.log('🔒 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * Agent Route Guard
 * Only allows users with 'agent' or 'admin' role (the live-chat inbox)
 */
const AgentRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'agent' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * Public Route Guard
 * Redirects authenticated users away from public pages
 */
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    console.log('🔒 PublicRoute: User already logged in, redirecting to dashboard');
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return children;
};

// ============================================================
// ✅ DASHBOARD LAYOUT - Premium Design
// ============================================================

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen app-mesh-bg overflow-hidden">
      {/* Backdrop — mobile/tablet only, closes drawer on tap */}
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 content-mesh">
          {children}
        </main>
      </div>
      {/* Floating live-chat button - only renders itself for role === 'customer' */}
      <ChatWidget />
    </div>
  );
};

// ============================================================
// ✅ SCROLL TO TOP - Navigation Helper
// ============================================================

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  
  return null;
};

// ============================================================
// ✅ MAIN APP COMPONENT
// ============================================================

function App() {
  const { user, loading } = useAuth();

  console.log('📱 App initialized', { 
    user: user?.email || 'Not logged in', 
    role: user?.role || 'None',
    loading 
  });

  // Show loader while authentication is being checked
  if (loading) {
    return <Loader size="xl" text="Loading your experience..." subtext="Please wait" />;
  }

  return (
    <Suspense fallback={<Loader size="lg" text="Loading page..." />}>
      <ScrollToTop />
      <Routes>
        {/* ============================================================
            PUBLIC ROUTES - No authentication required
            ============================================================ */}
        
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />

        {/* ============================================================
            EMAIL VERIFICATION ROUTES
            ============================================================ */}
        
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-pending" element={<VerifyEmailPending />} />

        {/* ============================================================
            ADMIN AUTH ROUTES
            ============================================================ */}
        
        <Route path="/admin/login" element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        } />

        {/* ============================================================
            ADMIN PROTECTED ROUTES
            ============================================================ */}
        
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } />

        <Route path="/admin/users/add" element={
          <AdminRoute>
            <AdminAddUser />
          </AdminRoute>
        } />

        <Route path="/admin/users/edit/:id" element={
          <AdminRoute>
            <AdminEditUser />
          </AdminRoute>
        } />

        {/* ============================================================
            USER PROTECTED ROUTES
            ============================================================ */}
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/tickets" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Tickets />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/tickets/create" element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateTicket />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/tickets/:id" element={
          <ProtectedRoute>
            <DashboardLayout>
              <TicketDetails />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* ✅ Billing & Payments — notun add kora hoyeche (Billing Step 1) */}
        <Route path="/billing" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Billing />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/live-chat" element={
          <AgentRoute>
            <DashboardLayout>
              <LiveChat />
            </DashboardLayout>
          </AgentRoute>
        } />

        {/* ============================================================
            DEFAULT ROUTES
            ============================================================ */}
        
        <Route path="/" element={
          <Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />
        } />
        
        <Route path="*" element={
          <Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />
        } />
      </Routes>
    </Suspense>
  );
}

export default App;