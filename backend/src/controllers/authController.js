// ============================================================
// backend/src/controllers/authController.js
// ============================================================
// Description: Professional Authentication Controller
// Version: 4.0.0
// ============================================================

import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { generateTokens, verifyRefreshToken } from '../utils/generateToken.js';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService.js';
import { notifyAdmins } from '../services/notificationService.js';
import { NOTIFICATION_TYPES } from '../models/Notification.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

// ============================================================
// ✅ REGISTER - With Email Verification
// ============================================================

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    console.log('📝 Register attempt:', { email });

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists. Please login.',
        error: 'USER_ALREADY_EXISTS'
      });
    }

    // Create user
    // Email verification is disabled — new accounts are verified immediately.
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'customer',
      isEmailVerified: true
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };

    console.log('✅ User registered:', email);

    res.status(201).json(
      ApiResponse.success(
        {
          user: userData,
          accessToken,
          refreshToken
        },
        'Registration successful.'
      )
    );

    logger.info(`User registered: ${user.email}`);
  } catch (error) {
    console.error('❌ Registration error:', error);
    next(error);
  }
};

// ============================================================
// ✅ LOGIN - With Proper Error Responses
// ============================================================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('📝 Login attempt:', { email });

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +refreshToken');

    // Check if user exists
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please register first.',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User deactivated:', email);
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Email verification check is disabled — accounts log in regardless of
    // isEmailVerified status.

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin
    };

    console.log('✅ User logged in:', email);

    res.status(200).json(
      ApiResponse.success(
        { user: userData, accessToken, refreshToken },
        'Login successful'
      )
    );

    logger.info(`User logged in: ${user.email}`);

    // ✅ Let the admin panel know someone logged in (shows up under the
    // "Others" tab of the admin notification bell). Skip when an admin
    // logs in themselves — no need to notify admins about admin logins.
    if (user.role !== 'admin') {
      notifyAdmins({
        type: NOTIFICATION_TYPES.USER_LOGIN,
        title: 'User Logged In',
        message: `${user.name} (${user.email}) just logged in.`,
        relatedUser: user._id,
        priority: 'low',
        metadata: { name: user.name, email: user.email, role: user.role }
      }).catch((err) => logger.error('Failed to send login notification to admins:', err));
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    next(error);
  }
};

// ============================================================
// ✅ VERIFY EMAIL
// ============================================================

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    console.log('📝 Verification token received:', token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
        error: 'TOKEN_REQUIRED'
      });
    }

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('🔑 Hashed token:', hashedToken);

    // Find user with matching token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      // Check if token exists but expired
      const expiredUser = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $lte: Date.now() }
      });

      if (expiredUser) {
        return res.status(400).json({
          success: false,
          message: 'Verification token has expired. Please request a new one.',
          error: 'TOKEN_EXPIRED'
        });
      }

      // Check if already verified
      const verifiedUser = await User.findOne({
        emailVerificationToken: hashedToken,
        isEmailVerified: true
      });

      if (verifiedUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified. Please login.',
          error: 'ALREADY_VERIFIED'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid verification token',
        error: 'INVALID_TOKEN'
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    console.log('✅ Email verified for:', user.email);

    res.status(200).json(
      ApiResponse.success(
        { 
          email: user.email, 
          verified: true,
          message: 'Email verified successfully! You can now login.'
        },
        'Email verified successfully!'
      )
    );

    logger.info(`Email verified: ${user.email}`);
  } catch (error) {
    console.error('❌ Verification error:', error);
    next(error);
  }
};

// ============================================================
// ✅ RESEND VERIFICATION EMAIL
// ============================================================

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'EMAIL_REQUIRED'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
        error: 'USER_NOT_FOUND'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. Please login.',
        error: 'ALREADY_VERIFIED'
      });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    console.log('📧 New verification token generated for:', user.email);

    sendVerificationEmail(user.email, user.name, verificationToken).catch(err => {
      logger.error('Failed to send verification email:', err);
    });

    res.status(200).json(
      ApiResponse.success(
        { message: 'Verification email sent successfully' },
        'Verification email sent successfully'
      )
    );

    logger.info(`Verification email resent: ${user.email}`);
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    next(error);
  }
};

// ============================================================
// ✅ LOGOUT
// ============================================================

export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
    logger.info(`User logged out: ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ REFRESH TOKEN
// ============================================================

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json(ApiResponse.success(tokens, 'Token refreshed successfully'));
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ PROFILE
// ============================================================

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.status(200).json(ApiResponse.success(user, 'Profile fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, bio, address, preferences } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (address) user.address = address;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    const userData = user.sanitize();

    res.status(200).json(ApiResponse.success(userData, 'Profile updated successfully'));
    logger.info(`User profile updated: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ CHANGE PASSWORD
// ============================================================

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(ApiResponse.success(null, 'Password changed successfully'));
    logger.info(`Password changed for user: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ FORGOT PASSWORD
// ============================================================

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new ApiError(404, 'No user found with this email');
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json(ApiResponse.success(null, 'Password reset link sent to your email'));
    logger.info(`Password reset requested for: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ RESET PASSWORD
// ============================================================

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ApiError(400, 'Token and new password are required');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json(ApiResponse.success(null, 'Password reset successful'));
    logger.info(`Password reset for user: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ ADMIN USER MANAGEMENT
// ============================================================

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json(
      ApiResponse.success(
        {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        'Users fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (req.user.id === id && role && role !== user.role) {
      throw new ApiError(403, 'Cannot change your own role');
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive
    };

    res.status(200).json(
      ApiResponse.success(userData, 'User updated successfully')
    );

    logger.info(`User updated by admin: ${req.user.email} -> ${user.email}`);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      throw new ApiError(403, 'Cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Clean up related data so nothing orphaned is left pointing at a
    // deleted user (e.g. a Live Chat entry with no customer to resolve).
    await Ticket.deleteMany({ customer: id });
    await Chat.deleteMany({ customer: id });
    await Notification.deleteMany({ user: id });

    res.status(200).json(
      ApiResponse.success(null, 'User deleted successfully')
    );

    logger.info(`User deleted by admin: ${req.user.email} -> ${user.email}`);
  } catch (error) {
    next(error);
  }
};
// ============================================================
// ✅ FIREBASE LOGIN
// ============================================================

export const firebaseLogin = async (req, res, next) => {
  try {
    const { uid, email, name, emailVerified } = req.body;

    if (!email) {
      throw new ApiError(400, 'Email is required');
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = new User({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: Math.random().toString(36).slice(-8),
        role: 'customer',
        isActive: true,
        isEmailVerified: emailVerified || false,
        firebaseUid: uid
      });
      await user.save();
      logger.info(`User created from Firebase: ${user.email}`);
    } else {
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified
    };

    res.status(200).json(
      ApiResponse.success(
        { user: userData, accessToken, refreshToken },
        'Login successful'
      )
    );

    logger.info(`Firebase login: ${user.email}`);

    // ✅ Same login notification as the regular login flow, so admins
    // see Firebase (Google) logins in the notification bell too.
    if (user.role !== 'admin') {
      notifyAdmins({
        type: NOTIFICATION_TYPES.USER_LOGIN,
        title: 'User Logged In',
        message: `${user.name} (${user.email}) just logged in.`,
        relatedUser: user._id,
        priority: 'low',
        metadata: { name: user.name, email: user.email, role: user.role }
      }).catch((err) => logger.error('Failed to send login notification to admins:', err));
    }
  } catch (error) {
    next(error);
  }
};