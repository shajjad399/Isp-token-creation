// ============================================================
// frontend/src/App.jsx
// ============================================================
// Description: Enterprise-grade Application Router
// Version: 2.0.0
// ============================================================

import React, { lazy, Suspense, useEffect } from 'react';
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

// ============================================================
// ✅ LOADING COMPONENT - Premium Design
// ============================================================

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-b-transparent rounded-full animate-spin animation-delay-150"></div>
        </div>
      </div>
      <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading your experience...</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Please wait</p>
    </div>
  </div>
);

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

const DashboardLayout = ({ children }) => (
  <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
    {/* Floating live-chat button - only renders itself for role === 'customer' */}
    <ChatWidget />
  </div>
);

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
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
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