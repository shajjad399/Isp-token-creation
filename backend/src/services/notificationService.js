// ============================================================
// backend/src/services/notificationService.js
// ============================================================
// Description: Central place to CREATE a notification AND push it
// to the user live over Socket.IO in one call. Also emits
// read / read-all events so the unread "dot" updates instantly
// on every open tab/device without a page refresh.
// ============================================================

import Notification from '../models/Notification.js';
import logger from '../config/logger.js';

let io = null;

/**
 * Called once from server.js right after the Socket.IO server is created,
 * so this service can emit events to connected clients.
 */
export const initNotificationSocket = (socketInstance) => {
  io = socketInstance;
};

/**
 * Get current unread count for a user (used to keep the badge accurate).
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, isRead: false });
};

/**
 * ✅ Create a notification in DB AND emit it live to the user's socket room.
 * Use this everywhere instead of calling Notification.create(...) directly.
 *
 * @param {Object} payload - same shape as Notification schema fields
 * @returns {Promise<Notification>}
 */
export const createAndSendNotification = async (payload) => {
  const notification = await Notification.create(payload);

  // Populate a couple of useful refs before sending to the client
  await notification.populate('relatedTicket', 'ticketId title status');

  if (io) {
    try {
      const unreadCount = await getUnreadCount(payload.user);

      io.to(`user_${payload.user}`).emit('new_notification', {
        notification,
        unreadCount
      });
    } catch (error) {
      logger.error('Notification socket emit error:', error);
    }
  }

  return notification;
};

/**
 * ✅ Emit a "this notification was read" event so other open tabs/devices
 * remove the dot / update the list live, without needing to poll.
 */
export const emitNotificationRead = async (userId, notificationId) => {
  if (!io) return;
  try {
    const unreadCount = await getUnreadCount(userId);
    io.to(`user_${userId}`).emit('notification_read', {
      notificationId,
      unreadCount
    });
  } catch (error) {
    logger.error('Notification-read socket emit error:', error);
  }
};

/**
 * ✅ Emit "all notifications read" so the dot clears everywhere instantly.
 */
export const emitAllNotificationsRead = async (userId) => {
  if (!io) return;
  try {
    io.to(`user_${userId}`).emit('all_notifications_read', {
      unreadCount: 0
    });
  } catch (error) {
    logger.error('All-notifications-read socket emit error:', error);
  }
};

export default {
  initNotificationSocket,
  createAndSendNotification,
  emitNotificationRead,
  emitAllNotificationsRead
};