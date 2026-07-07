// backend/src/controllers/notificationController.js
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../config/logger.js';
import { emitNotificationRead, emitAllNotificationsRead } from '../services/notificationService.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isRead } = req.query;

    const query = { user: req.user.id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('relatedTicket', 'ticketId title')
        .populate('relatedUser', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query)
    ]);

    res.status(200).json(
      ApiResponse.success({
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Notifications fetched successfully')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.status(200).json(
      ApiResponse.success({ count }, 'Unread count fetched successfully')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: req.user.id
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    // ✅ Let every open tab/device know this one is read (dot updates live)
    await emitNotificationRead(req.user.id, notification._id);

    res.status(200).json(
      ApiResponse.success(notification, 'Notification marked as read')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // ✅ Clear the dot live on every open tab/device
    await emitAllNotificationsRead(req.user.id);

    res.status(200).json(
      ApiResponse.success(null, 'All notifications marked as read')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    res.status(200).json(
      ApiResponse.success(null, 'Notification deleted successfully')
    );

  } catch (error) {
    next(error);
  }
};