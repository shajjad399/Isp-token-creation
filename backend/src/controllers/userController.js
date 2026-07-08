import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadDir } from '../config/cloudinary.js';
import logger from '../config/logger.js';
import path from 'path';
import fs from 'fs';

// ============================================================
// ✅ GET PROFILE (with stats)
// ============================================================

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const [totalTickets, openTickets, resolvedTickets, unreadNotifications] = await Promise.all([
      Ticket.countDocuments({ customer: user._id }),
      Ticket.countDocuments({ customer: user._id, status: 'open' }),
      Ticket.countDocuments({ customer: user._id, status: 'resolved' }),
      Notification.countDocuments({ user: user._id, isRead: false })
    ]);

    res.status(200).json(
      ApiResponse.success({
        user,
        stats: {
          totalTickets,
          openTickets,
          resolvedTickets,
          inProgressTickets: totalTickets - openTickets - resolvedTickets,
          unreadNotifications
        }
      }, 'Profile fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ UPLOAD PROFILE PHOTO
// ============================================================

export const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Delete old avatar file from local disk if it exists
    if (user.avatar) {
      try {
        const oldFilename = user.avatar.split('/').pop();
        const oldFilePath = path.join(uploadDir, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (error) {
        logger.warn('Failed to delete old avatar:', error);
      }
    }

    // ✅ req.file.path আসলে সার্ভারের নিজস্ব ফাইল সিস্টেম path — এখন সঠিক URL সেভ করছি
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.status(200).json(
      ApiResponse.success({ avatar: user.avatar }, 'Profile photo uploaded successfully')
    );

    logger.info(`Profile photo uploaded for: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ UPDATE PROFILE
// ============================================================

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, address, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (address) user.address = address;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;
    delete userData.passwordResetToken;
    delete userData.passwordResetExpires;

    res.status(200).json(
      ApiResponse.success(userData, 'Profile updated successfully')
    );

    logger.info(`Profile updated: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ DELETE ACCOUNT
// ============================================================

export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Delete user's tickets
    await Ticket.deleteMany({ customer: user._id });

    // Delete user's notifications
    await Notification.deleteMany({ user: user._id });

    // Delete avatar file from local disk if it exists
    if (user.avatar) {
      try {
        const filename = user.avatar.split('/').pop();
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        logger.warn('Failed to delete avatar:', error);
      }
    }

    await user.deleteOne();

    res.status(200).json(
      ApiResponse.success(null, 'Account deleted successfully')
    );

    logger.info(`Account deleted: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ GET ACTIVITY LOG
// ============================================================

export const getActivityLog = async (req, res, next) => {
  try {
    const { limit = 20, type } = req.query;

    const query = { user: req.user.id };
    if (type) query.type = type;

    const [tickets, notifications] = await Promise.all([
      Ticket.find({ customer: req.user.id })
        .select('ticketId title status priority createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .lean(),
      Notification.find(query)
        .select('title message type isRead createdAt relatedTicket')
        .populate('relatedTicket', 'ticketId title')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean()
    ]);

    res.status(200).json(
      ApiResponse.success({
        tickets,
        notifications,
        total: {
          tickets: tickets.length,
          notifications: notifications.length
        }
      }, 'Activity log fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ GET USER STATS
// ============================================================

export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [totalTickets, openTickets, resolvedTickets, notifications] = await Promise.all([
      Ticket.countDocuments({ customer: userId }),
      Ticket.countDocuments({ customer: userId, status: 'open' }),
      Ticket.countDocuments({ customer: userId, status: 'resolved' }),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);

    res.status(200).json(
      ApiResponse.success({
        totalTickets,
        openTickets,
        resolvedTickets,
        inProgressTickets: totalTickets - openTickets - resolvedTickets,
        unreadNotifications: notifications
      }, 'User stats fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ GET USER TICKETS
// ============================================================

export const getUserTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user.id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(query)
    ]);

    res.status(200).json(
      ApiResponse.success({
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Tickets fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ GET AGENT PERFORMANCE (Admin Only)
// ============================================================

export const getAgentPerformance = async (req, res, next) => {
  try {
    const agents = await User.find({ role: { $in: ['admin', 'agent'] } })
      .select('name email');

    const performance = await Promise.all(agents.map(async (agent) => {
      const tickets = await Ticket.find({ assignedTo: agent._id });

      const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      const open = tickets.filter(t => t.status === 'open' || t.status === 'in-progress');

      let avgResolutionTime = 0;
      const resolvedTickets = tickets.filter(t => t.resolvedAt);
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, t) => {
          return sum + (t.resolvedAt.getTime() - t.createdAt.getTime());
        }, 0);
        avgResolutionTime = totalTime / resolvedTickets.length;
      }

      return {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        totalTickets: tickets.length,
        resolvedTickets: resolved.length,
        openTickets: open.length,
        avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)), // in hours
        completionRate: tickets.length > 0 ? (resolved.length / tickets.length * 100) : 0
      };
    }));

    // Sort by completion rate
    performance.sort((a, b) => b.completionRate - a.completionRate);

    res.status(200).json(
      ApiResponse.success(performance, 'Agent performance fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};