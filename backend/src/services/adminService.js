// ============================================================
// backend/src/services/adminService.js
// ============================================================
// Description: Admin service with all business logic
// Version: 2.0.0
// ============================================================

import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';

class AdminService {
  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  async getAllUsers(filters = {}) {
    try {
      const { page = 1, limit = 10, role, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

      const query = {};
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
          .sort(sort)
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
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId)
        .select('-password -refreshToken -passwordResetToken -passwordResetExpires');

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error in getUserById:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const { name, email, password, role, phone, isActive } = userData;

      // Check if exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new ApiError(409, 'User with this email already exists');
      }

      // Create user
      const user = new User({
        name,
        email: email.toLowerCase(),
        password,
        role: role || 'customer',
        phone: phone || '',
        isActive: isActive !== undefined ? isActive : true
      });

      await user.save();

      logger.info(`Admin created new user: ${user.email} (${user.role})`);

      return user.sanitize();
    } catch (error) {
      logger.error('Error in createUser:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData, currentUserId) {
    try {
      const { name, email, role, phone, isActive } = updateData;

      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Prevent self-role demotion
      if (currentUserId === userId && role && role !== 'admin') {
        throw new ApiError(403, 'Admin cannot change their own role to non-admin');
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (role) user.role = role;
      if (phone !== undefined) user.phone = phone;
      if (typeof isActive === 'boolean') user.isActive = isActive;

      await user.save();

      logger.info(`Admin updated user: ${user.email} (${user.role})`);

      return user.sanitize();
    } catch (error) {
      logger.error('Error in updateUser:', error);
      throw error;
    }
  }

  async deleteUser(userId, currentUserId) {
    try {
      if (currentUserId === userId) {
        throw new ApiError(403, 'Admin cannot delete their own account');
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Clean up related data
      await Ticket.deleteMany({ customer: userId });
      await Notification.deleteMany({ user: userId });

      logger.info(`Admin deleted user: ${user.email}`);

      return { deleted: true, email: user.email };
    } catch (error) {
      logger.error('Error in deleteUser:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(userIds, updateData) {
    try {
      const { isActive, role } = updateData;

      if (typeof isActive !== 'boolean' && !role) {
        throw new ApiError(400, 'Invalid update data');
      }

      const update = {};
      if (typeof isActive === 'boolean') update.isActive = isActive;
      if (role) update.role = role;

      const result = await User.updateMany(
        { _id: { $in: userIds } },
        update
      );

      logger.info(`Admin bulk updated ${result.modifiedCount} users`);

      return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      };
    } catch (error) {
      logger.error('Error in bulkUpdateUsers:', error);
      throw error;
    }
  }

  // ============================================================
  // DASHBOARD STATS - FIXED WITH ERROR HANDLING
  // ============================================================

  async getDashboardStats() {
    try {
      logger.info('📡 Fetching dashboard stats...');

      const [
        totalUsers,
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        roleStats,
        priorityStats
      ] = await Promise.all([
        User.countDocuments().catch(() => 0),
        Ticket.countDocuments().catch(() => 0),
        Ticket.countDocuments({ status: 'open' }).catch(() => 0),
        Ticket.countDocuments({ status: 'in-progress' }).catch(() => 0),
        Ticket.countDocuments({ status: 'resolved' }).catch(() => 0),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]).catch(() => []),
        Ticket.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]).catch(() => [])
      ]);

      // Format role stats
      const byRole = {};
      roleStats.forEach(stat => {
        byRole[stat._id] = (byRole[stat._id] || 0) + stat.count;
      });

      // Format priority stats
      const byPriority = {};
      priorityStats.forEach(stat => {
        byPriority[stat._id] = (byPriority[stat._id] || 0) + stat.count;
      });

      // Calculate closed tickets (ensure no negative)
      const closedTickets = Math.max(0, totalTickets - (openTickets + inProgressTickets + resolvedTickets));

      const stats = {
        totalUsers: totalUsers || 0,
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        inProgressTickets: inProgressTickets || 0,
        resolvedTickets: resolvedTickets || 0,
        closedTickets: closedTickets || 0,
        byRole: byRole,
        byPriority: byPriority
      };

      logger.info('✅ Stats fetched:', stats);
      return stats;

    } catch (error) {
      logger.error('❌ Error in getDashboardStats:', error);
      // Return default stats instead of throwing
      return {
        totalUsers: 0,
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        byRole: {},
        byPriority: {}
      };
    }
  }

  // ============================================================
  // USER ACTIVITY
  // ============================================================

  async getUserActivity(userId, limit = 20) {
    try {
      const tickets = await Ticket.find({ customer: userId })
        .select('ticketId title status priority createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();

      const comments = await Ticket.aggregate([
        { $match: { customer: userId } },
        { $unwind: { path: '$comments', preserveNullAndEmptyArrays: true } },
        { $sort: { 'comments.createdAt': -1 } },
        { $limit: 10 },
        {
          $project: {
            ticketId: 1,
            title: 1,
            comment: '$comments.message',
            commentedAt: '$comments.createdAt'
          }
        }
      ]);

      return {
        recentTickets: tickets || [],
        recentComments: comments || []
      };
    } catch (error) {
      logger.error('Error in getUserActivity:', error);
      return {
        recentTickets: [],
        recentComments: []
      };
    }
  }
}

export default new AdminService();