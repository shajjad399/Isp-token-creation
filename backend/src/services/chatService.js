// ============================================================
// backend/src/services/chatService.js
// ============================================================
// Description: Centralized Socket.IO emitters for live chat.
// Rooms used:
//   chat_<chatId>  -> both participants of one conversation
//   agents         -> every connected agent/admin (new chat alerts)
//   user_<userId>  -> a specific user (e.g. "your chat was claimed")
// ============================================================

import logger from '../config/logger.js';

let io = null;

export const initChatSocket = (socketInstance) => {
  io = socketInstance;
};

/** A brand-new chat entered the queue - alert all available agents. */
export const emitChatStarted = (chat) => {
  if (!io) return;
  try {
    io.to('agents').emit('chat_started', { chat });
  } catch (error) {
    logger.error('chatService emitChatStarted error:', error);
  }
};

/** A new message was added to a chat. */
export const emitChatMessage = (chatId, message, customerId, agentId) => {
  if (!io) return;
  try {
    io.to(`chat_${chatId}`).emit('chat_message', { chatId, message });

    // Also nudge the recipient's personal room in case they haven't
    // opened this specific chat window yet (e.g. agent inbox badge).
    const recipientId = message.senderRole === 'customer' ? agentId : customerId;
    if (recipientId) {
      io.to(`user_${recipientId}`).emit('chat_new_message_alert', {
        chatId,
        preview: message.message
      });
    }
  } catch (error) {
    logger.error('chatService emitChatMessage error:', error);
  }
};

/** An agent claimed an open chat - remove it from other agents' queues. */
export const emitChatClaimed = (chat) => {
  if (!io) return;
  try {
    io.to('agents').emit('chat_claimed', { chatId: chat._id, agent: chat.agent });
    io.to(`chat_${chat._id}`).emit('chat_claimed', { chatId: chat._id, agent: chat.agent });
    io.to(`user_${chat.customer._id || chat.customer}`).emit('chat_claimed', {
      chatId: chat._id,
      agent: chat.agent
    });
  } catch (error) {
    logger.error('chatService emitChatClaimed error:', error);
  }
};

/** A chat session ended. */
export const emitChatClosed = (chat) => {
  if (!io) return;
  try {
    io.to(`chat_${chat._id}`).emit('chat_closed', { chatId: chat._id });
  } catch (error) {
    logger.error('chatService emitChatClosed error:', error);
  }
};

/** An admin permanently deleted a chat - remove it from every open inbox live. */
export const emitChatDeleted = (chatId) => {
  if (!io) return;
  try {
    io.to('agents').emit('chat_deleted', { chatId });
    io.to(`chat_${chatId}`).emit('chat_deleted', { chatId });
  } catch (error) {
    logger.error('chatService emitChatDeleted error:', error);
  }
};

/** Messages were marked read - update read receipts live for the other side. */
export const emitChatRead = (chatId, readerRole) => {
  if (!io) return;
  try {
    io.to(`chat_${chatId}`).emit('chat_read', { chatId, readerRole });
  } catch (error) {
    logger.error('chatService emitChatRead error:', error);
  }
};

export default {
  initChatSocket,
  emitChatStarted,
  emitChatMessage,
  emitChatClaimed,
  emitChatClosed,
  emitChatDeleted,
  emitChatRead
};