// backend/src/services/ticketService.js
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import { generateTicketId } from '../utils/helpers.js';
import { sendTicketNotification } from './emailService.js';
import logger from '../config/logger.js';

class TicketService {
  /**
   * Create a new ticket
   */
  async createTicket(ticketData, userId) {
    const { title, description, category, priority, attachments } = ticketData;

    const ticketId = await generateTicketId();

    const ticket = new Ticket({
      ticketId,
      title,
      description,
      category,
      priority: priority || 'medium',
      customer: userId,
      attachments: attachments || []
    });

    await ticket.save();
    await ticket.populate('customer', 'name email phone');

    // Create notification
    await this._createNotification(
      userId,
      'ticket_created',
      'Ticket Created',
      `Your ticket #${ticketId} has been created successfully`,
      ticket._id
    );

    // Send email (background)
    sendTicketNotification(ticket, 'created').catch(err => {
      logger.error('Failed to send ticket creation email:', err);
    });

    logger.info(`Ticket created: ${ticketId} by ${userId}`);

    return ticket;
  }

  /**
   * Get tickets with filters
   */
  async getTickets(filters, userId, userRole) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search,
      assignedTo,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const query = this._buildQuery(filters, userId, userRole);

    const skip = (page - 1) * limit;
    const order = sortOrder === 'asc' ? 1 : -1;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('customer', 'name email phone')
        .populate('assignedTo', 'name email')
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(query)
    ]);

    // Get statistics
    const stats = await this._getTicketStats(query);

    return {
      tickets,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId, userId, userRole) {
    const ticket = await Ticket.findById(ticketId)
      .populate('customer', 'name email phone avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('comments.user', 'name email role avatar');

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // Check authorization
    this._checkAuthorization(ticket, userId, userRole);

    return ticket;
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId, updateData, userId, userRole) {
    const { title, description, category, priority } = updateData;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // Check authorization
    this._checkAuthorization(ticket, userId, userRole);

    // Prevent updating closed tickets
    if (ticket.status === 'closed') {
      throw new ApiError(400, 'Cannot update a closed ticket');
    }

    // Update fields
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;

    await ticket.save();
    await ticket.populate('customer', 'name email');
    await ticket.populate('assignedTo', 'name email');

    // Create notification
    await this._createNotification(
      ticket.customer._id,
      'ticket_updated',
      'Ticket Updated',
      `Ticket #${ticket.ticketId} has been updated`,
      ticket._id
    );

    logger.info(`Ticket updated: ${ticket.ticketId} by ${userId}`);

    return ticket;
  }

  /**
   * Delete ticket (Admin only)
   */
  async deleteTicket(ticketId, userId) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    await ticket.deleteOne();
    await Notification.deleteMany({ relatedTicket: ticketId });

    logger.info(`Ticket deleted: ${ticket.ticketId} by ${userId}`);
    return true;
  }

  /**
   * Assign ticket to agent
   */
  async assignTicket(ticketId, assignedTo, userId) {
    if (!assignedTo) {
      throw new ApiError(400, 'Agent ID is required');
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // Check if ticket is closed
    if (ticket.status === 'closed') {
      throw new ApiError(400, 'Cannot assign a closed ticket');
    }

    // Check if agent exists
    const agent = await User.findById(assignedTo);
    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }
    if (!['admin', 'agent'].includes(agent.role)) {
      throw new ApiError(400, 'User is not an agent or admin');
    }

    // Update ticket
    ticket.assignedTo = assignedTo;
    if (ticket.status === 'open') {
      ticket.status = 'in-progress';
    }
    await ticket.save();
    await ticket.populate('assignedTo', 'name email');

    // Create notifications
    await this._createNotification(
      assignedTo,
      'ticket_assigned',
      'Ticket Assigned',
      `You have been assigned ticket #${ticket.ticketId}`,
      ticket._id
    );

    await this._createNotification(
      ticket.customer,
      'ticket_assigned',
      'Agent Assigned',
      `An agent has been assigned to your ticket #${ticket.ticketId}`,
      ticket._id
    );

    logger.info(`Ticket assigned: ${ticket.ticketId} -> ${agent.email} by ${userId}`);

    return ticket;
  }

  /**
   * Change ticket status
   */
  async changeStatus(ticketId, status, resolution, userId, userRole) {
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // Check authorization
    if (userRole === 'customer') {
      if (status !== 'closed') {
        throw new ApiError(403, 'Customers can only close tickets');
      }
      if (ticket.customer.toString() !== userId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    // Update status
    ticket.status = status;

    if (status === 'resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
      if (resolution) ticket.resolution = resolution;
    }

    if (status === 'closed') {
      ticket.closedAt = new Date();
    }

    await ticket.save();
    await ticket.populate('customer', 'name email');
    await ticket.populate('assignedTo', 'name email');

    // Create notifications
    await this._createNotification(
      ticket.customer._id,
      `ticket_${status}`,
      `Ticket ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Ticket #${ticket.ticketId} status changed to ${status}`,
      ticket._id
    );

    if (ticket.assignedTo) {
      await this._createNotification(
        ticket.assignedTo._id,
        `ticket_${status}`,
        `Ticket ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Ticket #${ticket.ticketId} status changed to ${status}`,
        ticket._id
      );
    }

    logger.info(`Ticket status changed: ${ticket.ticketId} -> ${status} by ${userId}`);

    return ticket;
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId, commentData, userId, userRole) {
    const { message, isInternal = false } = commentData;

    if (!message || message.trim() === '') {
      throw new ApiError(400, 'Comment message is required');
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // Check authorization
    if (userRole === 'customer' && ticket.customer.toString() !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    if (ticket.status === 'closed') {
      throw new ApiError(400, 'Cannot add comment to a closed ticket');
    }

    // Add comment
    ticket.comments.push({
      user: userId,
      message: message.trim(),
      isInternal: isInternal && userRole !== 'customer'
    });

    await ticket.save();
    await ticket.populate('comments.user', 'name email role avatar');

    const addedComment = ticket.comments[ticket.comments.length - 1];

    // Notify customer if comment is from agent/admin
    if (userRole !== 'customer') {
      await this._createNotification(
        ticket.customer,
        'comment_added',
        'New Comment',
        `New comment added to ticket #${ticket.ticketId}`,
        ticket._id,
        { comment: message, commenter: addedComment.user.name }
      );
    }

    // Notify assigned agent if different from commenter
    if (ticket.assignedTo && ticket.assignedTo.toString() !== userId) {
      await this._createNotification(
        ticket.assignedTo,
        'comment_added',
        'New Comment',
        `New comment on ticket #${ticket.ticketId}`,
        ticket._id,
        { comment: message, commenter: addedComment.user.name }
      );
    }

    logger.info(`Comment added to ticket: ${ticket.ticketId} by ${userId}`);

    return addedComment;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId, userRole) {
    let matchQuery = {};

    if (userRole === 'customer') {
      matchQuery.customer = userId;
    } else if (userRole === 'agent') {
      matchQuery = {
        $or: [
          { assignedTo: userId },
          { status: 'open' }
        ]
      };
    }

    const [statusStats, priorityStats, categoryStats, recentTickets, total] = await Promise.all([
      Ticket.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Ticket.find(matchQuery)
        .populate('customer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Ticket.countDocuments(matchQuery)
    ]);

    const formatStats = (statsArray) => {
      const obj = {};
      statsArray.forEach(stat => {
        obj[stat._id] = stat.count;
      });
      return obj;
    };

    return {
      total,
      byStatus: formatStats(statusStats),
      byPriority: formatStats(priorityStats),
      byCategory: formatStats(categoryStats),
      recent: recentTickets
    };
  }

  /**
   * Build query based on filters
   */
  _buildQuery(filters, userId, userRole) {
    const query = {};

    // Role-based filtering
    if (userRole === 'customer') {
      query.customer = userId;
    } else if (userRole === 'agent') {
      query.$or = [
        { assignedTo: userId },
        { status: 'open' }
      ];
    }

    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    // Search
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { ticketId: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Date range
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    return query;
  }

  /**
   * Get ticket statistics
   */
  async _getTicketStats(query) {
    const stats = await Ticket.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObject = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      statsObject[stat._id] = stat.count;
    });

    return statsObject;
  }

  /**
   * Check authorization for ticket access
   */
  _checkAuthorization(ticket, userId, userRole) {
    if (userRole === 'customer' && ticket.customer._id.toString() !== userId) {
      throw new ApiError(403, 'Access denied. You can only view your own tickets');
    }

    if (userRole === 'agent' && 
        ticket.assignedTo?._id?.toString() !== userId && 
        ticket.status !== 'open') {
      throw new ApiError(403, 'Access denied');
    }
  }

  /**
   * Create notification helper
   */
  async _createNotification(userId, type, title, message, relatedTicket, metadata = {}) {
    if (!userId) return;
    
    try {
      await Notification.create({
        user: userId,
        type,
        title,
        message,
        relatedTicket,
        metadata
      });
    } catch (error) {
      logger.error('Failed to create notification:', error);
    }
  }
}

export default new TicketService();