// ============================================================
// backend/src/models/Chat.js
// ============================================================
// Description: Live support chat schema - one document per
// customer chat session, with embedded messages, unread
// tracking, and an optional link to a support ticket.
// ============================================================

import mongoose from 'mongoose';

// ============================================================
// CHAT SCHEMA
// ============================================================

const chatSchema = new mongoose.Schema({
  // ============================================================
  // PARTICIPANTS
  // ============================================================

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
    index: true
  },

  // Agent/admin currently handling this chat (null while waiting in queue)
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  // ============================================================
  // STATUS
  // ============================================================
  // open   -> waiting in queue, no agent has picked it up yet
  // active -> an agent has joined and is chatting
  // closed -> conversation ended
  status: {
    type: String,
    enum: ['open', 'active', 'closed'],
    default: 'open',
    index: true
  },

  // Optional link so a chat can be escalated into a formal ticket
  relatedTicket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null
  },

  subject: {
    type: String,
    trim: true,
    maxlength: [150, 'Subject cannot exceed 150 characters'],
    default: 'General Support'
  },

  // ============================================================
  // MESSAGES
  // ============================================================

  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['customer', 'agent', 'admin', 'system'],
      required: true
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ============================================================
  // QUICK-ACCESS METADATA (avoids scanning `messages` for lists/badges)
  // ============================================================

  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  lastMessagePreview: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // Unread counts per side, so the customer widget and agent inbox
  // can each show their own badge without recomputing from messages.
  unreadCount: {
    customer: { type: Number, default: 0 },
    agent: { type: Number, default: 0 }
  },

  // ============================================================
  // LIFECYCLE
  // ============================================================

  closedAt: {
    type: Date
  },

  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Simple post-chat satisfaction rating (optional)
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: { type: String, trim: true, maxlength: 500 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// VIRTUALS
// ============================================================

chatSchema.virtual('isActive').get(function() {
  return this.status !== 'closed';
});

chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// ============================================================
// INDEXES
// ============================================================

chatSchema.index({ customer: 1, status: 1, createdAt: -1 });
chatSchema.index({ agent: 1, status: 1, lastMessageAt: -1 });
chatSchema.index({ status: 1, lastMessageAt: -1 });

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Append a message and update the quick-access metadata / unread counts
 * for whichever side did NOT send it.
 */
chatSchema.methods.addMessage = function({ senderId, senderRole, message, attachments = [] }) {
  this.messages.push({
    sender: senderId,
    senderRole,
    message,
    attachments,
    readBy: [senderId]
  });

  this.lastMessageAt = new Date();
  this.lastMessagePreview = message.length > 150 ? message.substring(0, 147) + '...' : message;

  if (senderRole === 'customer') {
    this.unreadCount.agent += 1;
  } else if (senderRole === 'agent' || senderRole === 'admin') {
    this.unreadCount.customer += 1;
  }

  return this;
};

/**
 * Mark every message as read by the given user and reset their side's
 * unread counter.
 */
chatSchema.methods.markRead = function(userId, role) {
  this.messages.forEach((msg) => {
    if (!msg.readBy.some((id) => id.toString() === userId.toString())) {
      msg.readBy.push(userId);
    }
  });

  if (role === 'customer') {
    this.unreadCount.customer = 0;
  } else {
    this.unreadCount.agent = 0;
  }

  return this;
};

/**
 * An agent/admin picks up an open (queued) chat.
 */
chatSchema.methods.claim = function(agentId) {
  this.agent = agentId;
  this.status = 'active';
  return this;
};

/**
 * Close the chat session.
 */
chatSchema.methods.close = function(closedByUserId) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = closedByUserId;
  return this;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Find the customer's current open/active chat, if any (so re-opening
 * the widget resumes the same conversation instead of starting a new one).
 */
chatSchema.statics.findOngoingForCustomer = function(customerId) {
  return this.findOne({ customer: customerId, status: { $in: ['open', 'active'] } })
    .sort({ createdAt: -1 })
    .populate('agent', 'name email avatar');
};

/**
 * Queue of chats waiting for an agent to pick up.
 */
chatSchema.statics.findQueue = function() {
  return this.find({ status: 'open' })
    .populate('customer', 'name email avatar')
    .sort({ createdAt: 1 });
};

/**
 * Chats currently being handled by a specific agent.
 */
chatSchema.statics.findActiveForAgent = function(agentId) {
  return this.find({ agent: agentId, status: 'active' })
    .populate('customer', 'name email avatar')
    .sort({ lastMessageAt: -1 });
};

// ============================================================
// MODEL
// ============================================================

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;