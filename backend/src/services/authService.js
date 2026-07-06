// backend/src/services/authService.js
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateTokens, verifyRefreshToken } from '../utils/generateToken.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from './emailService.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { name, email, password, phone, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'customer'
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Send welcome email (background)
    sendWelcomeEmail(user.email, user.name).catch(err => {
      logger.error('Failed to send welcome email:', err);
    });

    // Prepare user data (exclude sensitive info)
    const userDataResponse = this._sanitizeUser(user);

    logger.info(`User registered: ${user.email} (${user.role})`);

    return {
      user: userDataResponse,
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +refreshToken');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    const userData = this._sanitizeUser(user);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: userData,
      accessToken,
      refreshToken
    };
  }

  /**
   * Logout user
   */
  async logout(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    logger.info(`User logged out: ${userId}`);
    return true;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Find user with refresh token
    const user = await User.findById(decoded.id)
      .select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId)
      .select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return this._sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const { name, phone, avatar } = updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    logger.info(`User profile updated: ${user.email}`);
    return this._sanitizeUser(user);
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    return true;
  }

  /**
   * Forgot password - send reset link
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new ApiError(404, 'No user found with this email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    logger.info(`Password reset requested for: ${user.email}`);
    return true;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new ApiError(400, 'Token and new password are required');
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    logger.info(`Password reset for user: ${user.email}`);
    return true;
  }

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(filters = {}) {
    const { page = 1, limit = 10, role, search } = filters;

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

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(userId, updateData, currentUserId) {
    const { name, email, role, phone, isActive } = updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent admin from changing their own role
    if (currentUserId === userId && role && role !== user.role) {
      throw new ApiError(403, 'Cannot change your own role');
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    logger.info(`User updated by admin: ${currentUserId} -> ${user.email}`);
    return this._sanitizeUser(user);
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId, currentUserId) {
    // Prevent self-deletion
    if (currentUserId === userId) {
      throw new ApiError(403, 'Cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`User deleted by admin: ${currentUserId} -> ${user.email}`);
    return true;
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  _sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    return userObj;
  }
}

export default new AuthService();