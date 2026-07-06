// ============================================================
// frontend/src/context/AuthContext.jsx
// ============================================================
// Description: Enterprise-Grade Authentication Context
// Version: 4.0.0
// ============================================================

import React, { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ============================================================
// ✅ AUTH CONTEXT
// ============================================================

export const AuthContext = createContext(null);

// ============================================================
// ✅ AUTH PROVIDER - Enterprise Grade
// ============================================================

export const AuthProvider = ({ children }) => {
  // ============================================================
  // STATE
  // ============================================================
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const authCheckRef = useRef(false);
  const loginAttempts = useRef(0);

  // ============================================================
  // ✅ CHECK AUTHENTICATION - Professional
  // ============================================================

  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (authCheckRef.current) return;
    authCheckRef.current = true;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('🔍 No token found, user is not authenticated');
        setLoading(false);
        setIsAuthenticated(false);
        setAuthCheckComplete(true);
        authCheckRef.current = false;
        return;
      }

      console.log('🔍 Validating token...');
      const response = await api.get('/auth/profile');
      
      if (response.data?.success) {
        const userData = response.data.data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log(`✅ User authenticated: ${userData.email} (${userData.role})`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Auth validation failed:', error.message);
      
      // Clear invalid session
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setError(error.message);
    } finally {
      setLoading(false);
      setAuthCheckComplete(true);
      authCheckRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ============================================================
  // ✅ LOGIN - Professional with Rate Limiting
  // ============================================================

  const login = async (email, password) => {
    try {
      // Rate limiting check
      if (loginAttempts.current >= 5) {
        const errorMsg = 'Too many login attempts. Please try again after 5 minutes.';
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log(`📡 Login attempt: ${email}`);
      setError(null);
      
      const response = await api.post('/auth/login', { email, password });
      
      // Reset login attempts on success
      loginAttempts.current = 0;

      if (!response.data?.success) {
        loginAttempts.current += 1;
        const errorMsg = response.data?.message || 'Login failed';
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = response.data.data;
      
      // Validate response data
      if (!data.accessToken || !data.user) {
        throw new Error('Invalid response data');
      }

      // Store tokens securely
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      console.log(`✅ User logged in: ${data.user.email} (${data.user.role})`);
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      loginAttempts.current += 1;
      
      // Extract meaningful error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        const { status, data } = error.response;
        const message = data?.message;
        
        switch (status) {
          case 400:
            errorMessage = message || 'Invalid request. Please check your inputs.';
            break;
          case 401:
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 403:
            errorMessage = message || 'Access denied. Please verify your email or contact support.';
            break;
          case 404:
            errorMessage = 'No account found with this email. Please register first.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  };

  // ============================================================
  // ✅ REGISTER - Professional
  // ============================================================

  const register = async (userData) => {
    try {
      console.log(`📡 Registration attempt: ${userData.email}`);
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      
      if (!response.data?.success) {
        const errorMsg = response.data?.message || 'Registration failed';
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = response.data.data;
      
      // Validate response
      if (!data.accessToken || !data.user) {
        throw new Error('Invalid response data');
      }

      // Store tokens
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      console.log(`✅ User registered: ${data.user.email}`);
      
      const successMsg = data.message || 'Registration successful! Please verify your email.';
      toast.success(successMsg);
      
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        const { status, data } = error.response;
        const message = data?.message;
        
        switch (status) {
          case 400:
            errorMessage = message || 'Invalid registration data. Please check your inputs.';
            break;
          case 409:
            errorMessage = 'User with this email already exists. Please login instead.';
            break;
          case 422:
            errorMessage = message || 'Validation failed. Please check your inputs.';
            break;
          default:
            errorMessage = message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  };

  // ============================================================
  // ✅ LOGOUT - Professional
  // ============================================================

  const logout = async () => {
    try {
      console.log('📡 Logging out...');
      
      // Attempt to notify server
      await api.post('/auth/logout').catch(() => {
        console.log('⚠️ Logout API call failed, proceeding with local cleanup');
      });
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local session
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ User logged out');
      toast.success('Logged out successfully');
    }
  };

  // ============================================================
  // ✅ UPDATE USER - Professional
  // ============================================================

  const updateUser = useCallback((updatedData) => {
    if (!user) return;
    
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    console.log(`✅ User updated locally: ${newUser.email}`);
  }, [user]);

  // ============================================================
  // ✅ REFRESH USER - Professional
  // ============================================================

  const refreshUser = useCallback(async () => {
    try {
      console.log('📡 Refreshing user data...');
      const response = await api.get('/auth/profile');
      
      if (response.data?.success) {
        const userData = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log(`✅ User data refreshed: ${userData.email}`);
        return { success: true, user: userData };
      }
      
      throw new Error('Failed to refresh user data');
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // ============================================================
  // ✅ RESEND VERIFICATION - Professional
  // ============================================================

  const resendVerification = useCallback(async (email) => {
    try {
      console.log(`📡 Resending verification email to: ${email}`);
      const response = await api.post('/auth/resend-verification', { email });
      
      if (response.data?.success) {
        toast.success('📧 Verification email sent! Please check your inbox.');
        return { success: true };
      }
      
      throw new Error(response.data?.message || 'Failed to resend verification');
    } catch (error) {
      console.error('❌ Failed to resend verification:', error);
      const message = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // ============================================================
  // ✅ CLEAR ERROR
  // ============================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================
  // ✅ MEMOIZED CONTEXT VALUE - Performance Optimization
  // ============================================================

  const value = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    authCheckComplete,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    resendVerification,
    clearError,
    // Helper methods
    hasRole: (role) => user?.role === role,
    isAdmin: user?.role === 'admin',
    isAgent: user?.role === 'agent',
    isCustomer: user?.role === 'customer',
    // Token management
    getToken: () => localStorage.getItem('token'),
    isTokenValid: () => !!localStorage.getItem('token'),
  }), [user, loading, error, isAuthenticated, authCheckComplete]);

  // ============================================================
  // ✅ RENDER
  // ============================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// ✅ USE AUTH HOOK - Professional
// ============================================================

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  
  if (!context) {
    throw new Error('❌ useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;