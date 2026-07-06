// ============================================================
// backend/src/models/User.js
// ============================================================
// Description: User schema with Firebase UID and Email Verification
// ============================================================

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // ✅ Firebase UID - New Field
  firebaseUid: {
    type: String,
    sparse: true,
    index: true
  },
  
  // ✅ Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  // User Role
  role: {
    type: String,
    enum: ['admin', 'agent', 'customer'],
    default: 'customer',
    index: true
  },
  
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_tickets', 'manage_settings', 'view_reports']
  }],
  
  // Contact Information
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number']
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Profile
  avatar: {
    type: String,
    default: null
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  lastLogin: {
    type: Date
  },
  
  refreshToken: {
    type: String,
    select: false
  },
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// VIRTUALS
// ============================================================

userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

userSchema.virtual('isAgent').get(function() {
  return this.role === 'agent';
});

userSchema.virtual('isCustomer').get(function() {
  return this.role === 'customer';
});

// ============================================================
// INDEXES
// ============================================================

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ isEmailVerified: 1 });

// ============================================================
// PRE-SAVE HOOKS
// ============================================================

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================
// INSTANCE METHODS
// ============================================================

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 3600000;
  return resetToken;
};

// ✅ Generate Email Verification Token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 86400000; // 24 hours
  return token;
};

// ✅ Verify Email
userSchema.methods.verifyEmail = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  if (this.emailVerificationToken !== hashedToken) return false;
  if (this.emailVerificationExpires < Date.now()) return false;
  this.isEmailVerified = true;
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  return true;
};

userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions?.includes(permission) || false;
};

userSchema.methods.sanitize = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.__v;
  return user;
};

// ============================================================
// STATIC METHODS
// ============================================================

userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
};

userSchema.statics.findActiveByRole = function(role) {
  return this.find({ role, isActive: true });
};

// ============================================================
// MODEL
// ============================================================

const User = mongoose.model('User', userSchema);

export default User;