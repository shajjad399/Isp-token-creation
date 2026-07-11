// ============================================================
// frontend/src/pages/LiveChat.jsx
// ============================================================
// Description: Agent/Admin live-chat inbox. Shows the queue of
// customers waiting for an agent, the agent's own active chats,
// and a chat panel to reply in real time.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { getFileUrl } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, InboxIcon, TrashIcon } from '@heroicons/react/24/outline';

// ------------------------------------------------------------
// Chat panel: renders whichever chat (queued or active) is selected
// ------------------------------------------------------------
const ChatPanel = ({ chatId, onClaimed, isAdmin, onDeleted }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const { chat, loading, sending, typingUser, sendMessage, markRead, notifyTyping, claimChat } =
    useChat({ chatId, enabled: !!chatId });

  useEffect(() => {
    if (chat) markRead();
  }, [chat?.messages?.length, markRead, chat]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat?.messages?.length]);

  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
        <ChatBubbleLeftRightIcon className="w-14 h-14 mb-3" />
        <p>Ekta chat select koro chat korar jonno</p>
      </div>
    );
  }

  if (loading || !chat) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading chat...</div>;
  }

  const isMine = chat.agent && (chat.agent._id === (user?._id || user?.id));

  const handleClaim = async () => {
    await claimChat();
    onClaimed?.(chat._id);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete chat with "${chat.customer?.name || 'this user'}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/chats/${chat._id}`);
      toast.success('Chat deleted');
      onDeleted?.(chat._id);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const value = text;
    setText('');
    await sendMessage(value);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={chat.customer?.name} src={getFileUrl(chat.customer?.avatar)} />
          <div>
            <p className="font-semibold text-gray-800 dark:text-white">{chat.customer?.name || 'Deleted user'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{chat.customer?.email || 'This account no longer exists'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chat.status === 'open' && (
            <Button size="sm" onClick={handleClaim}>Claim chat</Button>
          )}
          {chat.status === 'closed' && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              Closed
            </span>
          )}
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="Delete chat"
              title="Delete chat"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {chat.messages?.map((m) => {
          const mine = m.senderRole === 'agent' || m.senderRole === 'admin';
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                mine
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700'
              }`}>
                {m.message}
              </div>
            </div>
          );
        })}
        {typingUser && (
          <p className="text-xs text-gray-400 italic">{typingUser} is typing…</p>
        )}
      </div>

      {chat.status !== 'closed' && (chat.status === 'open' ? (
        <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200 dark:border-gray-700">
          Reply korar age chat-ta claim koro.
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); notifyTyping(); }}
            placeholder="Type a message…"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" disabled={sending || !isMine}>
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </form>
      ))}
    </div>
  );
};

// ------------------------------------------------------------
// Main page
// ------------------------------------------------------------
const LiveChat = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      const [queueRes, activeRes] = await Promise.all([
        api.get('/chats/queue'),
        api.get('/chats/active')
      ]);
      if (queueRes.data?.success) setQueue(queueRes.data.data || []);
      if (activeRes.data?.success) setActive(activeRes.data.data || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Remove a deleted chat from local state without a full refetch
  const removeChatFromLists = useCallback((chatId) => {
    setQueue((prev) => prev.filter((c) => c._id !== chatId));
    setActive((prev) => prev.filter((c) => c._id !== chatId));
    setSelectedId((prev) => (prev === chatId ? null : prev));
  }, []);

  // Admin-only: permanently delete a chat (e.g. one left behind by a
  // deleted user account, which shows up with a "?" avatar).
  const handleDeleteChat = async (chatId, customerName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete chat with "${customerName || 'this user'}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/chats/${chatId}`);
      removeChatFromLists(chatId);
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  // Live updates: new chat in queue, chat claimed by someone, new message badges
  useEffect(() => {
    if (!socket) return;

    const onStarted = () => {
      toast('New customer chat waiting', { icon: '💬' });
      loadLists();
    };
    const onClaimed = () => loadLists();
    const onNewMessageAlert = () => loadLists();
    const onClosed = () => loadLists();
    const onDeleted = ({ chatId }) => removeChatFromLists(chatId);

    socket.on('chat_started', onStarted);
    socket.on('chat_claimed', onClaimed);
    socket.on('chat_new_message_alert', onNewMessageAlert);
    socket.on('chat_closed', onClosed);
    socket.on('chat_deleted', onDeleted);
    // ✅ Resync the whole inbox after any (re)connect — covers network
    // drops, phone screen lock/unlock, and backend restarts, where
    // events missed while disconnected would otherwise never arrive.
    socket.on('connect', loadLists);

    return () => {
      socket.off('chat_started', onStarted);
      socket.off('chat_claimed', onClaimed);
      socket.off('chat_new_message_alert', onNewMessageAlert);
      socket.off('chat_closed', onClosed);
      socket.off('chat_deleted', onDeleted);
      socket.off('connect', loadLists);
    };
  }, [socket, loadLists, removeChatFromLists]);

  const handleClaimed = (chatId) => {
    loadLists();
    setSelectedId(chatId);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Left: lists */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <InboxIcon className="w-5 h-5" /> Live Chat
          </h2>
        </div>

        <div className="overflow-y-auto flex-1">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase text-gray-400">
            Waiting ({queue.length})
          </p>
          {queue.length === 0 && !loading && (
            <p className="px-4 py-2 text-sm text-gray-400">No one waiting</p>
          )}
          {queue.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedId(c._id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 group ${
                selectedId === c._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <Avatar name={c.customer?.name} src={getFileUrl(c.customer?.avatar)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{c.customer?.name || 'Deleted user'}</p>
                <p className="text-xs text-gray-500 truncate">{c.lastMessagePreview || 'New chat'}</p>
              </div>
              {isAdmin && (
                <span
                  role="button"
                  onClick={(e) => handleDeleteChat(c._id, c.customer?.name, e)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label="Delete chat"
                  title="Delete chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </span>
              )}
            </button>
          ))}

          <p className="px-4 pt-4 pb-1 text-xs font-semibold uppercase text-gray-400">
            My active chats ({active.length})
          </p>
          {active.length === 0 && !loading && (
            <p className="px-4 py-2 text-sm text-gray-400">No active chats</p>
          )}
          {active.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedId(c._id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 group ${
                selectedId === c._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <Avatar name={c.customer?.name} src={getFileUrl(c.customer?.avatar)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{c.customer?.name || 'Deleted user'}</p>
                <p className="text-xs text-gray-500 truncate">{c.lastMessagePreview}</p>
              </div>
              {c.unreadCount?.agent > 0 && (
                <span className="text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5 flex-shrink-0">
                  {c.unreadCount.agent}
                </span>
              )}
              {isAdmin && (
                <span
                  role="button"
                  onClick={(e) => handleDeleteChat(c._id, c.customer?.name, e)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label="Delete chat"
                  title="Delete chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: chat panel */}
      <ChatPanel
        chatId={selectedId}
        onClaimed={handleClaimed}
        isAdmin={isAdmin}
        onDeleted={removeChatFromLists}
      />
    </div>
  );
};

export default LiveChat;