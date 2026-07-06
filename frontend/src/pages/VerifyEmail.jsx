// frontend/src/pages/VerifyEmail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EnvelopeIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (token && !hasVerified.current) {
      hasVerified.current = true;
      verifyEmail();
    } else if (!token) {
      setError('No verification token provided');
      setLoading(false);
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/verify/${token}`);
      console.log('✅ Verification response:', response.data);
      
      setSuccess(true);
      setError('');
      toast.success('🎉 Email verified successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('❌ Verification error:', error);
      setSuccess(false);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setError('Invalid or expired verification token. Please request a new one.');
      } else {
        setError('Verification failed. Please try again.');
      }
      
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setResending(true);
      const response = await api.post('/auth/resend-verification', { email });
      toast.success('📧 Verification email sent! Please check your inbox.');
      setError('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-purple-600 border-b-transparent rounded-full animate-spin animation-delay-150"></div>
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-300">Verifying your email...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Please wait while we confirm your identity</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-lg"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-emerald-500/10 dark:shadow-gray-800/50 p-8 md:p-10 border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30"
              >
                <CheckCircleIcon className="h-12 w-12 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Email Verified! ✅</h2>
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full">
                  Account Activated
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Your email has been verified successfully. You can now access all features of your account.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 space-y-3"
              >
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Go to Login
                </Button>
                
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>✅ Secure</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>🔐 Encrypted</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>🛡️ Verified</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-red-500/10 dark:shadow-gray-800/50 p-8 md:p-10 border border-red-100 dark:border-red-900/30 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
                <XCircleIcon className="h-12 w-12 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
              <div className="mt-2 inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-full">
                Action Required
              </div>
              
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>

              <div className="mt-6 text-left">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                  Enter your email to resend verification link
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleResend}
                  loading={resending}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Resend Verification Email
                </Button>
                
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
                
                <Link to="/register" className="text-sm text-blue-600 hover:underline block text-center mt-2">
                  Create a new account →
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>🔒 Secure</span>
                  <span className="w-px h-4 bg-gray-300"></span>
                  <span>🛡️ Protected</span>
                  <span className="w-px h-4 bg-gray-300"></span>
                  <span>⚡ Fast</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;