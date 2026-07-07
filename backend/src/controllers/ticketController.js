// ============================================================
// backend/src/controllers/ticketController.js
// ============================================================
// Description: Professional Ticket Controller with all features
// Version: 4.0.0
// ============================================================

import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createAndSendNotification } from '../services/notificationService.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { generateTicketId } from '../utils/helpers.js';
import { sendTicketNotification } from '../services/emailService.js';
import logger from '../config/logger.js';

let io = null;
let userSockets = null;

export const initSocketIO = (socketInstance, userSocketsMap) => {
  io = socketInstance;
  userSockets = userSocketsMap;
};

// ============================================================
// ✅ NOTIFICATION TYPE MAP - COMPLETE
// ============================================================

const NOTIFICATION_TYPE_MAP = {
  created: 'ticket_created',
  assigned: 'ticket_assigned',
  updated: 'ticket_updated',
  open: 'ticket_reopened',
  'in-progress': 'ticket_in_progress',
  resolved: 'ticket_resolved',
  closed: 'ticket_closed',
  comment: 'comment_added'
};

// ============================================================
// ✅ STATUS VALIDATION
// ============================================================

const VALID_STATUSES = ['open', 'in-progress', 'resolved', 'closed'];
const STATUS_TRANSITIONS = {
  open: ['in-progress', 'resolved', 'closed'],
  'in-progress': ['open', 'resolved', 'closed'],
  resolved: ['open', 'closed'],
  closed: ['open']
};

// ============================================================
// CREATE TICKET
// ============================================================
export const createTicket = async (req, res, next) => {
  try {
    const { title, description, category, priority, attachments } = req.body;

    const ticketId = await generateTicketId();

    const ticket = new Ticket({
      ticketId,
      title,
      description,
      category,
      priority: priority || 'medium',
      customer: req.user.id,
      attachments: attachments || []
    });

    ticket.pushStatusHistory({
      oldStatus: null,
      newStatus: 'open',
      user: req.user,
      note: 'Ticket created'
    });

    await ticket.save();
    await ticket.populate('customer', 'name email phone');

    // Create notification
    await createAndSendNotification({
      user: req.user.id,
      type: NOTIFICATION_TYPE_MAP.created,
      title: 'Ticket Created',
      message: `Your ticket #${ticketId} has been created successfully`,
      relatedTicket: ticket._id,
      metadata: { ticketId, title }
    });

    // Send email notification
    sendTicketNotification(ticket, 'created').catch(err => {
      logger.error('Failed to send ticket creation email:', err);
    });

    // Emit socket event
    if (io && userSockets) {
      try {
        io.to(`user_${req.user.id}`).emit('ticket_created', {
          ticketId,
          title,
          status: ticket.status,
          createdAt: ticket.createdAt
        });
      } catch (error) {
        logger.error('Socket emit error:', error);
      }
    }

    res.status(201).json(
      ApiResponse.success(ticket, 'Ticket created successfully')
    );

    logger.info(`Ticket created: ${ticketId} by ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET ALL TICKETS
// ============================================================
export const getTickets = async (req, res, next) => {
  try {
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
    } = req.query;

    const query = {};

    // ============================================================
    // ✅ ROLE-BASED FILTERING
    // ============================================================
    
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    // Admin & Agent can see all tickets

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('customer', 'name email phone')
        .populate('assignedTo', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(query)
    ]);

    // Get statistics
    const stats = await Ticket.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObject = { open: 0, 'in-progress': 0, resolved: 0, closed: 0 };
    stats.forEach(stat => {
      statsObject[stat._id] = stat.count;
    });

    res.status(200).json(
      ApiResponse.success(
        {
          tickets,
          stats: {
            ...statsObject,
            total
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        'Tickets fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ GET TICKET BY ID - PROFESSIONAL
// ============================================================
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate('customer', 'name email phone avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('comments.user', 'name email role avatar');

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // ============================================================
    // ✅ AUTHORIZATION - PROFESSIONAL LEVEL
    // ============================================================
    
    const userRole = req.user.role;
    const userId = req.user.id;

    // Admin: Full access
    if (userRole === 'admin') {
      // Full access
    }
    // Agent: Full access (support staff)
    else if (userRole === 'agent') {
      // Full access for support
    }
    // Customer: Only own tickets
    else if (userRole === 'customer') {
      if (ticket.customer._id.toString() !== userId) {
        throw new ApiError(403, 'Access denied. You can only view your own tickets');
      }
    }

    res.status(200).json(
      ApiResponse.success(ticket, 'Ticket fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE TICKET
// ============================================================
export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // Authorization
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user.id) {
      throw new ApiError(403, 'Access denied');
    }

    if (ticket.status === 'closed') {
      throw new ApiError(400, 'Cannot update a closed ticket');
    }

    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;

    await ticket.save();
    await ticket.populate('customer', 'name email');
    await ticket.populate('assignedTo', 'name email');

    await createAndSendNotification({
      user: ticket.customer._id,
      type: NOTIFICATION_TYPE_MAP.updated,
      title: 'Ticket Updated',
      message: `Ticket #${ticket.ticketId} has been updated`,
      relatedTicket: ticket._id,
      metadata: { updatedBy: req.user.name }
    });

    if (io) {
      try {
        io.to(`ticket_${ticket._id}`).emit('ticket_updated', {
          ticketId: ticket.ticketId,
          updatedAt: ticket.updatedAt
        });
      } catch (error) {
        logger.error('Socket emit error:', error);
      }
    }

    res.status(200).json(
      ApiResponse.success(ticket, 'Ticket updated successfully')
    );

    logger.info(`Ticket updated: ${ticket.ticketId} by ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE TICKET
// ============================================================
export const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied. Only admin can delete tickets');
    }

    await ticket.deleteOne();
    await Notification.deleteMany({ relatedTicket: id });

    res.status(200).json(
      ApiResponse.success(null, 'Ticket deleted successfully')
    );

    logger.info(`Ticket deleted: ${ticket.ticketId} by ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ASSIGN TICKET
// ============================================================
export const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      throw new ApiError(400, 'Agent ID is required');
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    if (ticket.status === 'closed') {
      throw new ApiError(400, 'Cannot assign a closed ticket');
    }

    const agent = await User.findById(assignedTo);
    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }
    if (!['admin', 'agent'].includes(agent.role)) {
      throw new ApiError(400, 'User is not an agent or admin');
    }

    ticket.assignedTo = assignedTo;
    if (ticket.status === 'open') {
      ticket.pushStatusHistory({
        oldStatus: 'open',
        newStatus: 'in-progress',
        user: req.user,
        note: `Auto-updated on assignment to ${agent.name}`
      });
      ticket.status = 'in-progress';
    }
    await ticket.save();
    await ticket.populate('assignedTo', 'name email');

    // Notification for agent
    await createAndSendNotification({
      user: assignedTo,
      type: NOTIFICATION_TYPE_MAP.assigned,
      title: 'Ticket Assigned',
      message: `You have been assigned ticket #${ticket.ticketId}`,
      relatedTicket: ticket._id,
      metadata: { assignedBy: req.user.name }
    });

    // Notification for customer
    await createAndSendNotification({
      user: ticket.customer,
      type: NOTIFICATION_TYPE_MAP.assigned,
      title: 'Agent Assigned',
      message: `An agent has been assigned to your ticket #${ticket.ticketId}`,
      relatedTicket: ticket._id
    });

    if (io) {
      try {
        io.to(`ticket_${ticket._id}`).emit('ticket_assigned', {
          ticketId: ticket.ticketId,
          assignedTo: agent.name,
          status: ticket.status
        });
        io.to(`user_${assignedTo}`).emit('new_assignment', {
          ticketId: ticket.ticketId,
          title: ticket.title
        });
      } catch (error) {
        logger.error('Socket emit error:', error);
      }
    }

    res.status(200).json(
      ApiResponse.success(ticket, 'Ticket assigned successfully')
    );

    logger.info(`Ticket assigned: ${ticket.ticketId} -> ${agent.email} by ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ CHANGE STATUS - PROFESSIONAL LEVEL
// ============================================================
export const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    console.log('📝 Status Change Request:', { id, status, resolution });

    if (!status) {
      throw new ApiError(400, 'Status is required');
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    console.log('📝 Current Ticket Status:', ticket.status);

    // ============================================================
    // ✅ AUTHORIZATION - PROFESSIONAL LEVEL
    // ============================================================
    
    if (req.user.role === 'customer') {
      // Customer can only close tickets
      if (status !== 'closed') {
        throw new ApiError(403, 'Customers can only close tickets');
      }
      if (ticket.customer.toString() !== req.user.id) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const oldStatus = ticket.status;

    // ✅ Validate status transition
    if (oldStatus !== status) {
      const allowedTransitions = STATUS_TRANSITIONS[oldStatus] || [];
      if (!allowedTransitions.includes(status)) {
        throw new ApiError(400, `Cannot transition from ${oldStatus} to ${status}`);
      }
    }

    // ✅ Log this change into statusHistory BEFORE overwriting ticket.status
    ticket.pushStatusHistory({
      oldStatus,
      newStatus: status,
      user: req.user,
      note: resolution || null
    });

    // Update status
    ticket.status = status;

    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
      ticket.resolution = resolution || `Resolved by ${req.user.name}`;
    }

    if (status === 'closed') {
      ticket.closedAt = new Date();
    }

    if (status === 'open' && oldStatus === 'closed') {
      ticket.closedAt = null;
    }

    await ticket.save();
    await ticket.populate('customer', 'name email');
    await ticket.populate('assignedTo', 'name email');

    console.log('✅ Status Updated to:', ticket.status);

    // ============================================================
    // ✅ NOTIFICATION - PROFESSIONAL LEVEL
    // ============================================================
    
    const notificationType = NOTIFICATION_TYPE_MAP[status] || 'status_changed';

    // Notify customer (if not customer)
    if (req.user.role !== 'customer') {
      await createAndSendNotification({
        user: ticket.customer._id,
        type: notificationType,
        title: `Ticket ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Ticket #${ticket.ticketId} status changed from ${oldStatus} to ${status}`,
        relatedTicket: ticket._id,
        metadata: {
          oldStatus,
          newStatus: status,
          changedBy: req.user.name,
          ticketId: ticket.ticketId
        }
      });
    }

    // Notify assigned agent (if any and not the changer)
    if (ticket.assignedTo && ticket.assignedTo._id.toString() !== req.user.id) {
      await createAndSendNotification({
        user: ticket.assignedTo._id,
        type: notificationType,
        title: `Ticket ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Ticket #${ticket.ticketId} status changed from ${oldStatus} to ${status}`,
        relatedTicket: ticket._id,
        metadata: {
          oldStatus,
          newStatus: status,
          changedBy: req.user.name,
          ticketId: ticket.ticketId
        }
      });
    }

    // Emit socket event
    if (io) {
      try {
        io.to(`ticket_${ticket._id}`).emit('status_changed', {
          ticketId: ticket.ticketId,
          oldStatus,
          newStatus: status,
          updatedAt: ticket.updatedAt,
          changedBy: req.user.name
        });
      } catch (error) {
        logger.error('Socket emit error:', error);
      }
    }

    res.status(200).json(
      ApiResponse.success(ticket, `Ticket status changed from ${oldStatus} to ${status}`)
    );

    logger.info(`Ticket status changed: ${ticket.ticketId} ${oldStatus} -> ${status} by ${req.user.email}`);
  } catch (error) {
    console.error('❌ Status Change Error:', error);
    next(error);
  }
};

// ============================================================
// ADD COMMENT
// ============================================================
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;

    if (!message || message.trim() === '') {
      throw new ApiError(400, 'Comment message is required');
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user.id) {
      throw new ApiError(403, 'Access denied');
    }

    if (ticket.status === 'closed') {
      throw new ApiError(400, 'Cannot add comment to a closed ticket');
    }

    const isInternalComment = isInternal && req.user.role !== 'customer';

    ticket.comments.push({
      user: req.user.id,
      message: message.trim(),
      isInternal: isInternalComment
    });

    await ticket.save();
    await ticket.populate('comments.user', 'name email role avatar');

    const addedComment = ticket.comments[ticket.comments.length - 1];

    // Notify customer (if not customer)
    if (req.user.role !== 'customer') {
      await createAndSendNotification({
        user: ticket.customer,
        type: NOTIFICATION_TYPE_MAP.comment,
        title: 'New Comment',
        message: `New comment added to ticket #${ticket.ticketId}`,
        relatedTicket: ticket._id,
        metadata: { 
          comment: message, 
          commenter: req.user.name,
          isInternal: isInternalComment
        }
      });
    }

    // Notify assigned agent (if any and not commenter)
    if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user.id) {
      await createAndSendNotification({
        user: ticket.assignedTo,
        type: NOTIFICATION_TYPE_MAP.comment,
        title: 'New Comment',
        message: `New comment on ticket #${ticket.ticketId}`,
        relatedTicket: ticket._id,
        metadata: { 
          comment: message, 
          commenter: req.user.name,
          isInternal: isInternalComment
        }
      });
    }

    if (io) {
      try {
        io.to(`ticket_${ticket._id}`).emit('new_comment', {
          ticketId: ticket.ticketId,
          comment: addedComment,
          user: req.user
        });
      } catch (error) {
        logger.error('Socket emit error:', error);
      }
    }

    res.status(201).json(
      ApiResponse.success(addedComment, 'Comment added successfully')
    );

    logger.info(`Comment added to ticket: ${ticket.ticketId} by ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET DASHBOARD STATS
// ============================================================
export const getDashboardStats = async (req, res, next) => {
  try {
    let matchQuery = {};

    if (req.user.role === 'customer') {
      matchQuery.customer = req.user.id;
    }

    const [statusStats, priorityStats, categoryStats, recentTickets] = await Promise.all([
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
        .lean()
    ]);

    const statusStatsObj = {};
    statusStats.forEach(stat => {
      statusStatsObj[stat._id] = stat.count;
    });

    const priorityStatsObj = {};
    priorityStats.forEach(stat => {
      priorityStatsObj[stat._id] = stat.count;
    });

    const categoryStatsObj = {};
    categoryStats.forEach(stat => {
      categoryStatsObj[stat._id] = stat.count;
    });

    const total = Object.values(statusStatsObj).reduce((a, b) => a + b, 0);

    res.status(200).json(
      ApiResponse.success({
        total,
        byStatus: statusStatsObj,
        byPriority: priorityStatsObj,
        byCategory: categoryStatsObj,
        recent: recentTickets
      }, 'Dashboard stats fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET TICKET STATS (Admin/Agent)
// ============================================================
export const getTicketStats = async (req, res, next) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          byStatus: {
            $push: {
              status: '$_id',
              count: '$count'
            }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : { total: 0, byStatus: [] };
    
    res.status(200).json(
      ApiResponse.success(result, 'Ticket stats fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};