// ============================================================
// backend/src/services/notificationService.js
// ============================================================
// Description: Central place to CREATE a notification AND push it
// to the user live over Socket.IO in one call. Also emits
// read / read-all events so the unread "dot" updates instantly
// on every open tab/device without a page refresh.
// ============================================================

import Notification from '../models/Notification.js';
import User from '../models/User.js';
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
  await notification.populate('relatedInvoice', 'invoiceNumber totalAmount amountPaid status dueDate');

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
 * ✅ Fan out a notification to every active admin, powering the admin
 * notification bell (Token / Payment / Others tabs).
 *
 * Use this for anything the admin panel should surface — a new
 * ticket/token, a bill payment event, a user login, etc. — instead of
 * calling createAndSendNotification per-admin manually.
 *
 * @param {Object} payload - same shape as Notification schema fields,
 *   EXCEPT `user` is omitted (it's set per-admin automatically).
 * @param {Object} [options]
 * @param {string|Object} [options.excludeUserId] - skip notifying this
 *   user if they happen to be an admin (e.g. don't notify an admin about
 *   their own login).
 * @returns {Promise<Notification[]>}
 */
export const notifyAdmins = async (payload, options = {}) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');

    const excludeId = options.excludeUserId ? String(options.excludeUserId) : null;

    const targets = admins.filter((admin) => String(admin._id) !== excludeId);

    if (targets.length === 0) return [];

    const results = await Promise.all(
      targets.map((admin) =>
        createAndSendNotification({ ...payload, user: admin._id }).catch((error) => {
          logger.error(`Failed to notify admin ${admin._id}:`, error);
          return null;
        })
      )
    );

    return results.filter(Boolean);
  } catch (error) {
    logger.error('notifyAdmins error:', error);
    return [];
  }
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
  notifyAdmins,
  emitNotificationRead,
  emitAllNotificationsRead
};