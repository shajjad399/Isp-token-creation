// ============================================================
// backend/src/models/Notification.js
// ============================================================
// Description: Enterprise-grade notification schema with all status support
// Version: 3.0.0
// ============================================================

import mongoose from 'mongoose';

// ============================================================
// ✅ ENUMS & CONSTANTS - Complete with all statuses
// ============================================================

const NOTIFICATION_TYPES = {
  // Ticket Related - Complete Status Support
  TICKET_CREATED: 'ticket_created',
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_UPDATED: 'ticket_updated',
  TICKET_OPEN: 'ticket_open',
  TICKET_IN_PROGRESS: 'ticket_in_progress',
  TICKET_RESOLVED: 'ticket_resolved',
  TICKET_CLOSED: 'ticket_closed',
  TICKET_REOPENED: 'ticket_reopened',
  TICKET_ESCALATED: 'ticket_escalated',
  TICKET_MERGED: 'ticket_merged',
  TICKET_SPLIT: 'ticket_split',
  
  // Comment Related
  COMMENT_ADDED: 'comment_added',
  COMMENT_MENTION: 'comment_mention',
  COMMENT_REPLIED: 'comment_replied',
  
  // User Related
  USER_REGISTERED: 'user_registered',
  USER_VERIFIED: 'user_verified',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  
  // System Related
  SYSTEM_ALERT: 'system_alert',
  MAINTENANCE: 'maintenance',
  SECURITY_ALERT: 'security_alert',
  BACKUP_COMPLETED: 'backup_completed',
  BACKUP_FAILED: 'backup_failed',
  
  // Reporting
  REPORT_READY: 'report_ready',
  REPORT_SCHEDULED: 'report_scheduled',
  
  // SLA Related
  SLA_BREACHED: 'sla_breached',
  SLA_WARNING: 'sla_warning',
  SLA_RESOLVED: 'sla_resolved',

  // Billing / Invoice Related
  INVOICE_CREATED: 'invoice_created',
  INVOICE_DUE_REMINDER: 'invoice_due_reminder',
  INVOICE_OVERDUE: 'invoice_overdue',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_CLAIM_SUBMITTED: 'payment_claim_submitted',
  PAYMENT_CLAIM_APPROVED: 'payment_claim_approved',
  PAYMENT_CLAIM_REJECTED: 'payment_claim_rejected'
};

const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
  CRITICAL: 'critical'
};

const DELIVERY_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  BOUNCED: 'bounced',
  BLOCKED: 'blocked'
};

const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook',
  SLACK: 'slack',
  WHATSAPP: 'whatsapp'
};

// ============================================================
// ✅ STATUS COLOR MAP
// ============================================================

const STATUS_COLORS = {
  'open': 'blue',
  'in-progress': 'yellow',
  'resolved': 'green',
  'closed': 'gray',
  'ticket_open': 'blue',
  'ticket_in_progress': 'yellow',
  'ticket_resolved': 'green',
  'ticket_closed': 'gray'
};

const STATUS_ICONS = {
  'open': '🔵',
  'in-progress': '🟡',
  'resolved': '🟢',
  'closed': '⚪',
  'ticket_open': '🔵',
  'ticket_in_progress': '🟡',
  'ticket_resolved': '🟢',
  'ticket_closed': '⚪'
};

// ============================================================
// NOTIFICATION SCHEMA
// ============================================================

const notificationSchema = new mongoose.Schema({
  // ============================================================
  // RECIPIENT INFORMATION
  // ============================================================
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  
  // ============================================================
  // NOTIFICATION CONTENT
  // ============================================================
  
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    required: [true, 'Notification type is required'],
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [5, 'Message must be at least 5 characters'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  shortMessage: {
    type: String,
    trim: true,
    maxlength: [200, 'Short message cannot exceed 200 characters']
  },
  
  // ============================================================
  // STATUS TRACKING - Complete Support
  // ============================================================
  
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  
  oldStatus: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed']
  },
  
  newStatus: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed']
  },
  
  // ============================================================
  // RELATED DATA
  // ============================================================
  
  relatedTicket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    index: true
  },

  relatedInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    index: true
  },
  
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket.comments'
  },
  
  // ============================================================
  // METADATA & CONTEXT
  // ============================================================
  
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  
  context: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'system', 'email', 'webhook'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // ============================================================
  // PRIORITY & URGENCY
  // ============================================================
  
  priority: {
    type: String,
    enum: Object.values(NOTIFICATION_PRIORITIES),
    default: NOTIFICATION_PRIORITIES.MEDIUM,
    index: true
  },
  
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  expiresAt: {
    type: Date,
    index: true
  },
  
  // ============================================================
  // DELIVERY STATUS
  // ============================================================
  
  deliveryStatus: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.PENDING,
    index: true
  },
  
  deliveryAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  lastDeliveryAttempt: {
    type: Date
  },
  
  deliveryError: {
    type: String,
    trim: true
  },
  
  deliveryLogs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS)
    },
    message: String,
    error: String
  }],
  
  // ============================================================
  // CHANNELS
  // ============================================================
  
  channels: [{
    type: String,
    enum: Object.values(NOTIFICATION_CHANNELS)
  }],
  
  // ============================================================
  // READ STATUS
  // ============================================================
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date
  },
  
  readCount: {
    type: Number,
    default: 0
  },
  
  readHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  
  // ============================================================
  // ACTION BUTTONS
  // ============================================================
  
  actions: [{
    label: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      default: 'GET'
    },
    icon: String,
    variant: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'danger', 'warning'],
      default: 'primary'
    }
  }],
  
  // ============================================================
  // AUDIT TRAIL
  // ============================================================
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  deletedAt: {
    type: Date
  },
  
  // ============================================================
  // ANALYTICS
  // ============================================================
  
  analytics: {
    impressionCount: {
      type: Number,
      default: 0
    },
    clickCount: {
      type: Number,
      default: 0
    },
    actionCount: {
      type: Number,
      default: 0
    },
    timeToRead: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// ✅ VIRTUALS
// ============================================================

notificationSchema.virtual('statusColor').get(function() {
  return STATUS_COLORS[this.status] || STATUS_COLORS[this.newStatus] || 'blue';
});

notificationSchema.virtual('statusIcon').get(function() {
  return STATUS_ICONS[this.status] || STATUS_ICONS[this.newStatus] || '📌';
});

notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return Date.now() > this.expiresAt.getTime();
});

notificationSchema.virtual('timeSinceCreated').get(function() {
  return Date.now() - this.createdAt.getTime();
});

notificationSchema.virtual('statusDisplay').get(function() {
  if (this.isRead) return 'read';
  if (this.isExpired) return 'expired';
  if (this.isDeleted) return 'deleted';
  if (this.deliveryStatus === DELIVERY_STATUS.FAILED) return 'failed';
  return 'active';
});

// ============================================================
// ✅ INDEXES
// ============================================================

// User based indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, priority: 1, createdAt: -1 });
notificationSchema.index({ user: 1, deliveryStatus: 1 });
notificationSchema.index({ user: 1, status: 1 });

// Time based indexes
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });

// Type based indexes
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

// Compound indexes
notificationSchema.index({ user: 1, isRead: 1, priority: 1 });
notificationSchema.index({ user: 1, deliveryStatus: 1, createdAt: -1 });

// TTL index for auto-deletion (30 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// ============================================================
// ✅ PRE-SAVE HOOKS
// ============================================================

notificationSchema.pre('save', function(next) {
  // Set short message if not provided
  if (!this.shortMessage) {
    this.shortMessage = this.message.length > 200 
      ? this.message.substring(0, 197) + '...' 
      : this.message;
  }
  
  // Auto-expiry based on priority
  if (!this.expiresAt) {
    const expiryMap = {
      [NOTIFICATION_PRIORITIES.CRITICAL]: 1 * 24 * 60 * 60 * 1000,
      [NOTIFICATION_PRIORITIES.URGENT]: 2 * 24 * 60 * 60 * 1000,
      [NOTIFICATION_PRIORITIES.HIGH]: 3 * 24 * 60 * 60 * 1000,
      [NOTIFICATION_PRIORITIES.MEDIUM]: 7 * 24 * 60 * 60 * 1000,
      [NOTIFICATION_PRIORITIES.LOW]: 14 * 24 * 60 * 60 * 1000
    };
    this.expiresAt = new Date(Date.now() + (expiryMap[this.priority] || 7 * 24 * 60 * 60 * 1000));
  }
  
  // Set default channels
  if (!this.channels || this.channels.length === 0) {
    this.channels = [NOTIFICATION_CHANNELS.IN_APP];
  }
  
  // Log delivery attempt
  if (this.isModified('deliveryStatus')) {
    this.deliveryLogs.push({
      timestamp: new Date(),
      status: this.deliveryStatus,
      message: `Delivery status changed to ${this.deliveryStatus}`
    });
  }
  
  // Auto-set status from type
  if (!this.status) {
    const statusMap = {
      'ticket_open': 'open',
      'ticket_in_progress': 'in-progress',
      'ticket_resolved': 'resolved',
      'ticket_closed': 'closed'
    };
    this.status = statusMap[this.type] || 'open';
  }
  
  next();
});

// ============================================================
// ✅ INSTANCE METHODS
// ============================================================

notificationSchema.methods.markAsRead = function(metadata = {}) {
  this.isRead = true;
  this.readAt = new Date();
  this.readCount += 1;
  this.readHistory.push({
    timestamp: new Date(),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
  this.deliveryStatus = DELIVERY_STATUS.READ;
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.deliveryStatus = DELIVERY_STATUS.DELIVERED;
  this.deliveryLogs.push({
    timestamp: new Date(),
    status: DELIVERY_STATUS.DELIVERED,
    message: 'Notification delivered successfully'
  });
  return this.save();
};

notificationSchema.methods.logDeliveryFailure = function(error) {
  this.deliveryAttempts += 1;
  this.lastDeliveryAttempt = new Date();
  this.deliveryError = error;
  this.deliveryStatus = DELIVERY_STATUS.FAILED;
  this.deliveryLogs.push({
    timestamp: new Date(),
    status: DELIVERY_STATUS.FAILED,
    error: error
  });
  return this.save();
};

notificationSchema.methods.trackImpression = function() {
  this.analytics.impressionCount += 1;
  return this.save();
};

notificationSchema.methods.trackClick = function() {
  this.analytics.clickCount += 1;
  return this.save();
};

notificationSchema.methods.trackAction = function(actionLabel) {
  this.analytics.actionCount += 1;
  return this.save();
};

notificationSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

notificationSchema.methods.isActionable = function() {
  return this.actions && this.actions.length > 0;
};

notificationSchema.methods.getPriorityColor = function() {
  const colorMap = {
    [NOTIFICATION_PRIORITIES.CRITICAL]: 'red',
    [NOTIFICATION_PRIORITIES.URGENT]: 'orange',
    [NOTIFICATION_PRIORITIES.HIGH]: 'yellow',
    [NOTIFICATION_PRIORITIES.MEDIUM]: 'blue',
    [NOTIFICATION_PRIORITIES.LOW]: 'gray'
  };
  return colorMap[this.priority] || 'blue';
};

// ============================================================
// ✅ STATIC METHODS
// ============================================================

notificationSchema.statics.getUnread = function(userId, limit = 50) {
  return this.find({ user: userId, isRead: false, isDeleted: false })
    .populate('relatedTicket', 'ticketId title status')
    .populate('relatedUser', 'name email avatar')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

notificationSchema.statics.getByPriority = function(userId, priority, limit = 20) {
  return this.find({ user: userId, priority, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date(),
      readCount: 1,
      deliveryStatus: DELIVERY_STATUS.READ
    }
  );
};

notificationSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: userId, isDeleted: false } },
    {
      $group: {
        _id: '$isRead',
        count: { $sum: 1 },
        byPriority: { $push: '$priority' },
        byType: { $push: '$type' },
        byStatus: { $push: '$status' }
      }
    }
  ]);
};

notificationSchema.statics.getByType = function(userId, type, limit = 20) {
  return this.find({ user: userId, type, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

notificationSchema.statics.cleanup = function(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return this.deleteMany({
    isRead: true,
    createdAt: { $lt: cutoff }
  });
};

notificationSchema.statics.getCounts = function(userId) {
  return this.aggregate([
    { $match: { user: userId, isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        },
        read: {
          $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] }
        },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        }
      }
    }
  ]);
};

// ============================================================
// ✅ MIDDLEWARE
// ============================================================

notificationSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

// ============================================================
// ✅ EXPORT
// ============================================================

const Notification = mongoose.model('Notification', notificationSchema);

// Export constants
export {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  DELIVERY_STATUS,
  NOTIFICATION_CHANNELS,
  STATUS_COLORS,
  STATUS_ICONS
};

export default Notification;