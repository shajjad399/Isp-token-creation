// ============================================================
// frontend/src/hooks/useNotifications.js
// ============================================================
// Description: Fetches the user's notifications, keeps the
// unread count and list live via Socket.IO, and exposes
// markAsRead / markAllAsRead actions.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchedOnce = useRef(false);

  // ============================================================
  // ✅ INITIAL FETCH
  // ============================================================
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications', { params: { limit: 20 } });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // ============================================================
  // ✅ LIVE SOCKET LISTENERS
  // ============================================================
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = ({ notification, unreadCount: liveCount }) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(liveCount);
      toast(notification.title || 'New notification', { icon: '🔔' });
    };

    const handleNotificationRead = ({ notificationId, unreadCount: liveCount }) => {
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(liveCount);
    };

    const handleAllRead = ({ unreadCount: liveCount }) => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(liveCount);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('all_notifications_read', handleAllRead);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('all_notifications_read', handleAllRead);
    };
  }, [socket]);

  // ============================================================
  // ✅ ACTIONS
  // ============================================================

  /** Mark a single notification as read (dot disappears instantly). */
  const markAsRead = useCallback(async (notificationId) => {
    // Optimistic local update so the dot clears immediately on click
    setNotifications(prev =>
      prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  /** Mark every notification as read. */
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
};

export default useNotifications;