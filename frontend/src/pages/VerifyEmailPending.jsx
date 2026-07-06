// frontend/src/pages/VerifyEmailPending.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';

const VerifyEmailPending = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setResending(true);
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <EnvelopeIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check Your Email 📧</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          We've sent a verification link to your email address.
        </p>
        
        <div className="mt-6">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="mt-6 space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleResend}
            loading={resending}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Resend Verification Email
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPending;