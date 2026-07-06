// backend/src/services/userService.js
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';

class UserService {
  /**
   * Get user profile with stats
   */
  async getProfile(userId) {
    const user = await User.findById(userId)
      .select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Get ticket counts
    const ticketCounts = await Ticket.aggregate([
      { $match: { customer: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {};
    ticketCounts.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    const userData = user.toObject();
    userData.ticketStats = stats;

    return userData;
  }

  /**
   * Update profile
   */
  async updateProfile(userId, updateData) {
    const { name, phone, avatar } = updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;

    logger.info(`Profile updated: ${user.email}`);
    return userData;
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(userId, filters = {}) {
    const { page = 1, limit = 10, status } = filters;

    const query = { customer: userId };
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

    return {
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get agent performance (Admin only)
   */
  async getAgentPerformance() {
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
        avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)),
        completionRate: tickets.length > 0 ? (resolved.length / tickets.length * 100) : 0
      };
    }));

    // Sort by completion rate
    performance.sort((a, b) => b.completionRate - a.completionRate);

    return performance;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findById(userId)
      .select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm, limit = 10) {
    if (!searchTerm) {
      return [];
    }

    const users = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name email role avatar')
    .limit(limit)
    .lean();

    return users;
  }

  /**
   * Get user statistics (Admin only)
   */
  async getUserStats() {
    const [totalUsers, roleStats, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.countDocuments({ isActive: true })
    ]);

    const roleStatsObj = {};
    roleStats.forEach(stat => {
      roleStatsObj[stat._id] = stat.count;
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      byRole: roleStatsObj
    };
  }

  /**
   * Update user status (deactivate/activate)
   */
  async updateUserStatus(userId, isActive, currentUserId) {
    if (userId === currentUserId) {
      throw new ApiError(403, 'Cannot change your own status');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${user.email}`);
    
    return {
      id: user._id,
      email: user.email,
      isActive: user.isActive
    };
  }

  /**
   * Get user activity log (simplified)
   */
  async getUserActivity(userId) {
    // This would normally fetch from an activity log collection
    // For now, we'll get recent ticket activity
    const recentTickets = await Ticket.find({ customer: userId })
      .select('ticketId title status createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const recentComments = await Ticket.find(
      { 'comments.user': userId },
      { 'comments.$': 1, ticketId: 1 }
    )
    .sort({ 'comments.createdAt': -1 })
    .limit(5)
    .lean();

    return {
      recentTickets,
      recentComments
    };
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(userId, newRole, currentUserId) {
    if (userId === currentUserId) {
      throw new ApiError(403, 'Cannot change your own role');
    }

    const validRoles = ['admin', 'agent', 'customer'];
    if (!validRoles.includes(newRole)) {
      throw new ApiError(400, 'Invalid role');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.role = newRole;
    await user.save();

    logger.info(`User role updated: ${user.email} -> ${newRole}`);
    
    return {
      id: user._id,
      email: user.email,
      role: user.role
    };
  }

  /**
   * Bulk user operations (Admin only)
   */
  async bulkUpdateUsers(userIds, updateData) {
    const { isActive } = updateData;

    if (typeof isActive !== 'boolean') {
      throw new ApiError(400, 'Invalid update data');
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isActive }
    );

    logger.info(`Bulk user update: ${result.modifiedCount} users ${isActive ? 'activated' : 'deactivated'}`);
    
    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    };
  }
}

export default new UserService();