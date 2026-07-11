// ============================================================
// backend/src/controllers/chatController.js
// ============================================================
// Description: Live support chat - start/resume a session, send
// messages, list the agent queue, claim, close, and mark read.
// ============================================================

import Chat from '../models/Chat.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../config/logger.js';
import { createAndSendNotification } from '../services/notificationService.js';
import {
  emitChatStarted,
  emitChatMessage,
  emitChatClaimed,
  emitChatClosed,
  emitChatDeleted,
  emitChatRead
} from '../services/chatService.js';

// ============================================================
// ✅ START OR RESUME A CHAT (Customer)
// ============================================================
export const startChat = async (req, res, next) => {
  try {
    const { subject } = req.body;

    // Resume an existing open/active chat instead of creating a duplicate
    let chat = await Chat.findOngoingForCustomer(req.user.id);

    if (!chat) {
      chat = await Chat.create({
        customer: req.user.id,
        subject: subject || 'General Support'
      });
      await chat.populate('agent', 'name email avatar');

      emitChatStarted(chat);
      logger.info(`Chat started by ${req.user.email}`);
    }

    res.status(200).json(
      ApiResponse.success(chat, 'Chat session ready')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ GET MY ONGOING CHAT (Customer)
// ============================================================
export const getMyChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOngoingForCustomer(req.user.id);

    res.status(200).json(
      ApiResponse.success(chat, 'Chat fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ GET CHAT BY ID (participant only)
// ============================================================
export const getChatById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id)
      .populate('customer', 'name email avatar')
      .populate('agent', 'name email avatar')
      .populate('messages.sender', 'name role avatar');

    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    const isParticipant =
      chat.customer._id.toString() === req.user.id ||
      (chat.agent && chat.agent._id.toString() === req.user.id);

    if (!isParticipant && req.user.role === 'customer') {
      throw new ApiError(403, 'Access denied');
    }

    res.status(200).json(
      ApiResponse.success(chat, 'Chat fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ SEND MESSAGE
// ============================================================
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, attachments = [] } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    if (chat.status === 'closed') {
      throw new ApiError(400, 'This chat has ended');
    }

    const isCustomerParticipant = chat.customer.toString() === req.user.id;
    const isAssignedAgent = chat.agent && chat.agent.toString() === req.user.id;
    const isUnclaimedAgentReply = !chat.agent && ['agent', 'admin'].includes(req.user.role);

    if (!isCustomerParticipant && !isAssignedAgent && !isUnclaimedAgentReply) {
      throw new ApiError(403, 'Access denied');
    }

    // First agent/admin reply auto-claims an unclaimed chat
    if (isUnclaimedAgentReply) {
      chat.claim(req.user.id);
    }

    const senderRole = req.user.role === 'customer' ? 'customer' : req.user.role;

    chat.addMessage({
      senderId: req.user.id,
      senderRole,
      message,
      attachments
    });

    await chat.save();
    await chat.populate('messages.sender', 'name role avatar');
    await chat.populate('customer', 'name email avatar');
    await chat.populate('agent', 'name email avatar');

    const newMessage = chat.messages[chat.messages.length - 1];

    emitChatMessage(chat._id, newMessage, chat.customer._id, chat.agent?._id);

    if (isUnclaimedAgentReply) {
      emitChatClaimed(chat);
    }

    // Notify the customer via the normal notification bell too, in case
    // they're not currently looking at the chat widget.
    if (senderRole !== 'customer') {
      await createAndSendNotification({
        user: chat.customer._id,
        type: 'chat_message',
        title: 'New message from support',
        message: newMessage.message,
        metadata: { chatId: chat._id.toString() }
      }).catch((err) => logger.error('Chat notification error:', err));
    }

    res.status(201).json(
      ApiResponse.success(chat, 'Message sent')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ MARK CHAT AS READ
// ============================================================
export const markChatRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    const role = req.user.role === 'customer' ? 'customer' : 'agent';
    chat.markRead(req.user.id, role);
    await chat.save();

    emitChatRead(chat._id, role);

    res.status(200).json(
      ApiResponse.success(chat, 'Chat marked as read')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ QUEUE - chats waiting for an agent (Admin/Agent)
// ============================================================
export const getQueue = async (req, res, next) => {
  try {
    const queue = await Chat.findQueue();

    res.status(200).json(
      ApiResponse.success(queue, 'Chat queue fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ MY ACTIVE CHATS (Admin/Agent)
// ============================================================
export const getMyActiveChats = async (req, res, next) => {
  try {
    const chats = await Chat.findActiveForAgent(req.user.id);

    res.status(200).json(
      ApiResponse.success(chats, 'Active chats fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ CLAIM A QUEUED CHAT (Admin/Agent)
// ============================================================
export const claimChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    if (chat.status !== 'open') {
      throw new ApiError(400, 'This chat has already been claimed or closed');
    }

    chat.claim(req.user.id);
    await chat.save();
    await chat.populate('agent', 'name email avatar');
    await chat.populate('customer', 'name email avatar');

    emitChatClaimed(chat);

    res.status(200).json(
      ApiResponse.success(chat, 'Chat claimed successfully')
    );

    logger.info(`Chat ${chat._id} claimed by ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ DELETE CHAT (Admin only)
// Permanently removes a chat session — used e.g. to clean up chats
// left behind for a customer whose account was deleted (shows up as
// a "?" avatar in the inbox since there's no user left to resolve).
// ============================================================
export const deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByIdAndDelete(id);

    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    emitChatDeleted(chat._id);

    res.status(200).json(
      ApiResponse.success(null, 'Chat deleted successfully')
    );

    logger.info(`Chat ${chat._id} deleted by ${req.user.email}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ CLOSE CHAT
// ============================================================
export const closeChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    const isCustomerParticipant = chat.customer.toString() === req.user.id;
    const isAssignedAgent = chat.agent && chat.agent.toString() === req.user.id;

    if (!isCustomerParticipant && !isAssignedAgent && req.user.role === 'customer') {
      throw new ApiError(403, 'Access denied');
    }

    chat.close(req.user.id);
    if (rating && isCustomerParticipant) {
      chat.rating = rating;
    }

    await chat.save();

    emitChatClosed(chat);

    res.status(200).json(
      ApiResponse.success(chat, 'Chat closed successfully')
    );
  } catch (error) {
    next(error);
  }
};