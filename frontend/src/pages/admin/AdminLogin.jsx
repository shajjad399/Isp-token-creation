// ============================================================
// frontend/src/pages/admin/AdminLogin.jsx
// ============================================================
// Description: Premium Enterprise Admin Login Page
// Version: 3.0.0
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  ArrowLeftIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

// ============================================================
// ✅ ANIMATION VARIANTS
// ============================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// ============================================================
// ✅ ADMIN LOGIN COMPONENT
// ============================================================

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  // Auto-focus email on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.querySelector('input[type="email"]');
      if (input) input.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Clear error when user types
  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  // ============================================================
  // ✅ HANDLE SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email.trim()) {
      setError('Please enter your admin email address');
      toast.error('Email is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData?.role === 'admin') {
        toast.success('Welcome Admin! 👋');
        navigate('/admin/dashboard');
      } else {
        setError('Access Denied! Only Admin can access this panel.');
        await logout();
        toast.error('Access Denied! Admin only.');
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  // ============================================================
  // ✅ RENDER
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="relative">
          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
            >
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </motion.div>

          {/* Main Card */}
          <motion.div
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            {/* Decorative Background */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/3 rounded-full blur-3xl"></div>
            
            {/* Top Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>

            {/* Content */}
            <div className="relative z-10 p-8 md:p-10">
              
              {/* Logo & Title */}
              <motion.div variants={fadeInUp} className="text-center mb-8">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30 relative"
                >
                  <ShieldCheckIcon className="h-10 w-10 text-white" />
                  <div className="absolute -top-1 -right-1">
                    <SparklesIcon className="h-4 w-4 text-yellow-300" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Admin Panel
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  ISP Ticketing System
                </p>
                <div className="mt-3 inline-block px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800/30">
                  🔐 Restricted Access
                </div>
              </motion.div>

              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl flex items-start gap-3"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                      {error.includes('Access Denied') && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          Please login with valid admin credentials
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <motion.form 
                variants={staggerChildren}
                initial="initial"
                animate="animate"
                onSubmit={handleSubmit} 
                className="space-y-5"
              >
                {/* Email Field */}
                <motion.div variants={fadeInUp}>
                  <div className={`relative transition-all duration-300 ${emailFocused ? 'scale-[1.01]' : ''}`}>
                    <Input
                      label="Admin Email"
                      type="email"
                      placeholder="admin@ispticketing.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={EnvelopeIcon}
                      required
                      autoFocus
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                    {email && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 bottom-2.5"
                      >
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div variants={fadeInUp}>
                  <div className={`relative transition-all duration-300 ${passwordFocused ? 'scale-[1.01]' : ''}`}>
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={LockClosedIcon}
                      required
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={fadeInUp}>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    loading={loading}
                    className="relative overflow-hidden group bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="h-5 w-5" />
                          Sign in as Admin
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </motion.div>

              </motion.form>

              {/* Footer */}
              <motion.div 
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors inline-flex items-center gap-1 group"
                  >
                    <ArrowLeftIcon className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                    Back to User Login
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;