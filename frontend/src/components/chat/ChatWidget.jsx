// ============================================================
// frontend/src/components/chat/ChatWidget.jsx
// ============================================================
// Description: Floating live-support chat button + panel shown
// to customers. Starts/resumes their chat only once opened.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import Avatar from '../ui/Avatar';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  const { chat, loading, sending, typingUser, sendMessage, markRead, notifyTyping } =
    useChat({ enabled: open });

  // Mark messages read whenever the panel is opened / new messages arrive
  useEffect(() => {
    if (open && chat) markRead();
  }, [open, chat?.messages?.length, markRead, chat]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages?.length, open]);

  // Only show this widget to customers - agents/admins get the inbox page instead
  if (user?.role !== 'customer') return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const value = text;
    setText('');
    await sendMessage(value);
  };

  const statusLabel = () => {
    if (!chat) return '';
    if (chat.status === 'closed') return 'Chat ended';
    if (chat.status === 'open') return 'Waiting for an agent…';
    return chat.agent?.name ? `Chatting with ${chat.agent.name}` : 'Agent connected';
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open live chat"
        >
          <ChatBubbleLeftRightIcon className="h-7 w-7" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="w-[calc(100vw-2rem)] max-w-96 sm:w-96 h-[70vh] max-h-[28rem] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div>
              <p className="font-semibold text-sm">Live Support</p>
              <p className="text-xs text-blue-100">{statusLabel()}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10"
              aria-label="Close chat"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900/40">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : chat?.messages?.length ? (
              chat.messages.map((msg) => {
                const isMine = msg.senderRole === 'customer';
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 text-center mt-8">
                Say hello 👋 — an agent will be with you shortly.
              </p>
            )}

            {typingUser && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Avatar name={typingUser} size="sm" />
                <span>{typingUser} is typing…</span>
              </div>
            )}
          </div>

          {/* Input */}
          {chat?.status !== 'closed' ? (
            <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  notifyTyping();
                }}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
              This chat has ended.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;