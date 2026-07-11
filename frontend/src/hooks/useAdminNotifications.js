// ============================================================
// frontend/src/hooks/useAdminNotifications.js
// ============================================================
// Description: Powers the admin notification bell. Same live
// Socket.IO plumbing as useNotifications, but additionally
// tracks the 3 admin tabs — Token, Payment, Others — each with
// its own notification list and unread badge count.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const EMPTY_COUNTS = { token: 0, payment: 0, other: 0, total: 0 };

export const useAdminNotifications = () => {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('token'); // 'token' | 'payment' | 'other'
  const [notificationsByTab, setNotificationsByTab] = useState({ token: [], payment: [], other: [] });
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const fetchedTabs = useRef(new Set());

  // ============================================================
  // ✅ FETCH — per-tab notification list (fetched lazily, once per tab)
  // ============================================================
  const fetchTab = useCallback(async (category, { force = false } = {}) => {
    if (fetchedTabs.current.has(category) && !force) return;
    fetchedTabs.current.add(category);

    try {
      setLoading(true);
      const res = await api.get('/notifications', { params: { limit: 20, category } });
      if (res.data?.success) {
        setNotificationsByTab((prev) => ({ ...prev, [category]: res.data.data.notifications }));
      }
    } catch (error) {
      console.error(`Failed to fetch ${category} notifications:`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get('/notifications/category-counts');
      if (res.data?.success) {
        setCounts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notification category counts:', error);
    }
  }, []);

  // Always load the counts + the default (Token) tab on mount
  useEffect(() => {
    fetchCounts();
    fetchTab('token');
  }, [fetchCounts, fetchTab]);

  // Load a tab's notifications the first time it's opened
  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  // ============================================================
  // ✅ LIVE SOCKET LISTENERS
  // ============================================================
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = ({ notification }) => {
      const category = notification.category || 'other';
      setNotificationsByTab((prev) => ({
        ...prev,
        [category]: [notification, ...(prev[category] || [])]
      }));
      setCounts((prev) => ({
        ...prev,
        [category]: (prev[category] || 0) + 1,
        total: prev.total + 1
      }));
      toast(notification.title || 'New notification', { icon: '🔔' });
    };

    const handleNotificationRead = ({ notificationId }) => {
      setNotificationsByTab((prev) => {
        const next = { ...prev };
        for (const cat of Object.keys(next)) {
          next[cat] = next[cat].map((n) => (n._id === notificationId ? { ...n, isRead: true } : n));
        }
        return next;
      });
      fetchCounts();
    };

    const handleAllRead = () => {
      setNotificationsByTab((prev) => {
        const next = { ...prev };
        for (const cat of Object.keys(next)) {
          next[cat] = next[cat].map((n) => ({ ...n, isRead: true }));
        }
        return next;
      });
      setCounts(EMPTY_COUNTS);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('all_notifications_read', handleAllRead);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('all_notifications_read', handleAllRead);
    };
  }, [socket, fetchCounts]);

  // ============================================================
  // ✅ ACTIONS
  // ============================================================

  const markAsRead = useCallback(async (notificationId, category) => {
    setNotificationsByTab((prev) => ({
      ...prev,
      [category]: (prev[category] || []).map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      )
    }));
    setCounts((prev) => ({
      ...prev,
      [category]: Math.max(0, (prev[category] || 0) - 1),
      total: Math.max(0, prev.total - 1)
    }));

    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotificationsByTab((prev) => {
      const next = { ...prev };
      for (const cat of Object.keys(next)) {
        next[cat] = next[cat].map((n) => ({ ...n, isRead: true }));
      }
      return next;
    });
    setCounts(EMPTY_COUNTS);

    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    notifications: notificationsByTab[activeTab] || [],
    counts,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: () => fetchTab(activeTab, { force: true })
  };
};

export default useAdminNotifications;