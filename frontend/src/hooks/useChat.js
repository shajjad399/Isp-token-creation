// ============================================================
// frontend/src/hooks/useChat.js
// ============================================================
// Description: Drives one live chat conversation. Used by the
// customer's floating ChatWidget (auto starts/resumes their
// session) and by the agent's chat window (given an existing
// chatId). Handles live messages, typing indicator, and actions.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

let typingTimeout = null;

export const useChat = ({ chatId: existingChatId, enabled = true } = {}) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const joinedRoomRef = useRef(null);

  const chatId = chat?._id || existingChatId;

  // ============================================================
  // ✅ LOAD / START CHAT
  // ============================================================
  const loadChat = useCallback(async () => {
    try {
      setLoading(true);
      if (existingChatId) {
        const res = await api.get(`/chats/${existingChatId}`);
        if (res.data?.success) setChat(res.data.data);
      } else {
        // Customer flow: resume ongoing chat or start a new one
        const res = await api.post('/chats', {});
        if (res.data?.success) setChat(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  }, [existingChatId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // ============================================================
  // ✅ JOIN / LEAVE THE CHAT ROOM
  // ============================================================
  useEffect(() => {
    if (!socket || !chatId) return;
    if (joinedRoomRef.current === chatId) return;

    if (joinedRoomRef.current) {
      socket.emit('leave_chat', joinedRoomRef.current);
    }

    socket.emit('join_chat', chatId);
    joinedRoomRef.current = chatId;

    return () => {
      socket.emit('leave_chat', chatId);
      joinedRoomRef.current = null;
    };
  }, [socket, chatId]);

  // ============================================================
  // ✅ LIVE EVENT LISTENERS
  // ============================================================
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleMessage = ({ chatId: incomingId, message }) => {
      if (incomingId !== chatId) return;
      setChat((prev) => {
        if (!prev) return prev;
        const exists = prev.messages?.some((m) => m._id === message._id);
        if (exists) return prev;
        return { ...prev, messages: [...(prev.messages || []), message] };
      });
      setTypingUser(null);
    };

    const handleClaimed = ({ chatId: incomingId, agent }) => {
      if (incomingId !== chatId) return;
      setChat((prev) => (prev ? { ...prev, status: 'active', agent } : prev));
      toast('An agent has joined the chat', { icon: '🙋' });
    };

    const handleClosed = ({ chatId: incomingId }) => {
      if (incomingId !== chatId) return;
      setChat((prev) => (prev ? { ...prev, status: 'closed' } : prev));
      toast('Chat has ended', { icon: '👋' });
    };

    const handleTyping = ({ chatId: incomingId, userId, name }) => {
      if (incomingId !== chatId || userId === (user?._id || user?.id)) return;
      setTypingUser(name || 'Someone');
    };

    const handleStopTyping = ({ chatId: incomingId, userId }) => {
      if (incomingId !== chatId || userId === (user?._id || user?.id)) return;
      setTypingUser(null);
    };

    socket.on('chat_message', handleMessage);
    socket.on('chat_claimed', handleClaimed);
    socket.on('chat_closed', handleClosed);
    socket.on('chat_typing', handleTyping);
    socket.on('chat_stop_typing', handleStopTyping);

    return () => {
      socket.off('chat_message', handleMessage);
      socket.off('chat_claimed', handleClaimed);
      socket.off('chat_closed', handleClosed);
      socket.off('chat_typing', handleTyping);
      socket.off('chat_stop_typing', handleStopTyping);
    };
  }, [socket, chatId, user]);

  // ============================================================
  // ✅ ACTIONS
  // ============================================================

  const sendMessage = useCallback(async (text) => {
    if (!chatId || !text?.trim()) return;
    try {
      setSending(true);
      const res = await api.post(`/chats/${chatId}/messages`, { message: text.trim() });
      if (res.data?.success) setChat(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [chatId]);

  const markRead = useCallback(async () => {
    if (!chatId) return;
    try {
      await api.patch(`/chats/${chatId}/read`);
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
  }, [chatId]);

  const closeChat = useCallback(async (rating) => {
    if (!chatId) return;
    try {
      const res = await api.patch(`/chats/${chatId}/close`, rating ? { rating } : {});
      if (res.data?.success) setChat(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close chat');
    }
  }, [chatId]);

  const claimChat = useCallback(async () => {
    if (!chatId) return;
    try {
      const res = await api.patch(`/chats/${chatId}/claim`);
      if (res.data?.success) setChat(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim chat');
    }
  }, [chatId]);

  /** Call on every keystroke - relays a live typing indicator, debounced. */
  const notifyTyping = useCallback(() => {
    if (!socket || !chatId) return;
    socket.emit('chat_typing', {
      chatId,
      userId: user?._id || user?.id,
      name: user?.name,
      role: user?.role
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('chat_stop_typing', { chatId, userId: user?._id || user?.id });
    }, 2000);
  }, [socket, chatId, user]);

  return {
    chat,
    loading,
    sending,
    typingUser,
    sendMessage,
    markRead,
    closeChat,
    claimChat,
    notifyTyping,
    refresh: loadChat
  };
};

export default useChat;