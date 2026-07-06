// ============================================================
// frontend/src/pages/Register.jsx
// ============================================================
// Description: Premium Enterprise Register Page with Validation
// Version: 3.0.0
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  PhoneIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
// ✅ PASSWORD VALIDATION HELPER
// ============================================================

const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const errors = [];
  if (!checks.length) errors.push('At least 8 characters');
  if (!checks.uppercase) errors.push('At least 1 uppercase letter (A-Z)');
  if (!checks.lowercase) errors.push('At least 1 lowercase letter (a-z)');
  if (!checks.number) errors.push('At least 1 number (0-9)');
  if (!checks.special) errors.push('At least 1 special character (!@#$%^&*)');
  
  return { checks, errors, isValid: errors.length === 0 };
};

// ============================================================
// ✅ REGISTER COMPONENT
// ============================================================

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ checks: {}, errors: [], isValid: false });
  const [showPasswordHelper, setShowPasswordHelper] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation on change
  useEffect(() => {
    if (formData.password.length > 0) {
      const validation = validatePassword(formData.password);
      setPasswordValidation(validation);
      setShowPasswordHelper(true);
    } else {
      setPasswordValidation({ checks: {}, errors: [], isValid: false });
      setShowPasswordHelper(false);
    }
  }, [formData.password]);

  // Clear error when user types
  useEffect(() => {
    if (error) setError('');
  }, [formData]);

  // ============================================================
  // ✅ HANDLE CHANGE
  // ============================================================

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ============================================================
  // ✅ HANDLE SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      toast.error('Name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      toast.error('Email is required');
      return;
    }

    if (!formData.password) {
      setError('Please enter a password');
      toast.error('Password is required');
      return;
    }

    // Validate password strength
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      setError('Password does not meet security requirements');
      toast.error('Please check password requirements');
      setShowPasswordHelper(true);
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(formData);
    setLoading(false);
    
    if (result.success) {
      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email-pending');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  // ============================================================
  // ✅ PASSWORD REQUIREMENT CHECK
  // ============================================================

  const PasswordRequirement = ({ label, isMet }) => (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-xs"
    >
      {isMet ? (
        <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <XCircleIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
      )}
      <span className={isMet ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
        {label}
      </span>
    </motion.li>
  );

  // ============================================================
  // ✅ RENDER
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50 dark:from-gray-900 dark:via-indigo-950/30 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
          
          {/* Decorative Background */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl"></div>
          
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          {/* Content */}
          <div className="relative z-10 p-8 md:p-10">
            
            {/* Logo */}
            <motion.div 
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="text-center mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-500/30 relative"
              >
                <span className="text-white font-bold text-2xl">T</span>
                <div className="absolute -top-1 -right-1">
                  <SparklesIcon className="h-3.5 w-3.5 text-yellow-300" />
                </div>
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Create Account
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Join ISP Ticketing System
              </p>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl flex items-start gap-2.5"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Register Form */}
            <motion.form 
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              {/* Name Field */}
              <motion.div variants={fadeInUp}>
                <div className={`relative transition-all duration-300 ${nameFocused ? 'scale-[1.01]' : ''}`}>
                  <Input
                    label="Full Name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    icon={UserIcon}
                    required
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                  {formData.name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 bottom-2.5"
                    >
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Email Field */}
              <motion.div variants={fadeInUp}>
                <div className={`relative transition-all duration-300 ${emailFocused ? 'scale-[1.01]' : ''}`}>
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    icon={EnvelopeIcon}
                    required
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  {formData.email && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 bottom-2.5"
                    >
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Password Field with Validation */}
              <motion.div variants={fadeInUp}>
                <div className="space-y-2">
                  <div className={`relative transition-all duration-300 ${passwordFocused ? 'scale-[1.01]' : ''}`}>
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a password (min 6 chars)"
                      value={formData.password}
                      onChange={handleChange}
                      icon={LockClosedIcon}
                      required
                      onFocus={() => {
                        setPasswordFocused(true);
                        if (formData.password.length > 0) setShowPasswordHelper(true);
                      }}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* ✅ Password Helper - Only in Register */}
                  <AnimatePresence>
                    {showPasswordHelper && formData.password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl"
                      >
                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                          Password Requirements:
                        </p>
                        <ul className="space-y-1">
                          <PasswordRequirement 
                            label="At least 8 characters" 
                            isMet={passwordValidation.checks.length || false} 
                          />
                          <PasswordRequirement 
                            label="At least 1 uppercase letter (A-Z)" 
                            isMet={passwordValidation.checks.uppercase || false} 
                          />
                          <PasswordRequirement 
                            label="At least 1 lowercase letter (a-z)" 
                            isMet={passwordValidation.checks.lowercase || false} 
                          />
                          <PasswordRequirement 
                            label="At least 1 number (0-9)" 
                            isMet={passwordValidation.checks.number || false} 
                          />
                          <PasswordRequirement 
                            label="At least 1 special character (!@#$%^&*)" 
                            isMet={passwordValidation.checks.special || false} 
                          />
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password Strength Indicator */}
                  {formData.password.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.min(
                              (passwordValidation.isValid ? 100 : 
                              (5 - passwordValidation.errors.length) * 20), 100
                            )}%` 
                          }}
                          className={`h-full rounded-full ${
                            passwordValidation.isValid ? 'bg-green-500' :
                            passwordValidation.errors.length <= 2 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {passwordValidation.isValid ? '✅ Strong' :
                         passwordValidation.errors.length <= 2 ? '🟡 Medium' :
                         '🔴 Weak'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Phone Field */}
              <motion.div variants={fadeInUp}>
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={PhoneIcon}
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={fadeInUp} className="pt-2">
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-5 w-5" />
                        Create Account
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </motion.div>

            </motion.form>

            {/* Footer Links */}
            <motion.div 
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="mt-6"
            >
              <p className="text-center text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;