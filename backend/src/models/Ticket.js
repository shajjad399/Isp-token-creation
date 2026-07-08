// ============================================================
// backend/src/models/Ticket.js
// ============================================================
// Description: Ticket schema and model
// ============================================================

import mongoose from 'mongoose';

// ============================================================
// TICKET SCHEMA
// ============================================================

const ticketSchema = new mongoose.Schema({
  // Ticket Identification
  ticketId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Ticket Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters']
  },
  
  // Classification
  category: {
    type: String,
    enum: ['internet', 'iptv', 'billing', 'technical', 'other'],
    required: [true, 'Category is required'],
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  
  // Relationships
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
    index: true
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  department: {
    type: String,
    enum: ['support', 'billing', 'technical', 'network'],
    default: 'support'
  },
  
  // Comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date
    }
  }],
  
  // Status change history
  statusHistory: [{
    oldStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String,
      trim: true,
      default: null
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Attachments
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number
    },
    mimeType: {
      type: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Resolution
  resolution: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution cannot exceed 1000 characters']
  },
  
  resolvedAt: {
    type: Date
  },
  
  closedAt: {
    type: Date
  },
  
  // Service Level Agreement
  sla: {
    responseTime: {
      type: Date
    },
    resolutionTime: {
      type: Date
    },
    breached: {
      type: Boolean,
      default: false
    },
    firstResponseAt: {
      type: Date
    },
    responseDueAt: {
      type: Date
    },
    resolutionDueAt: {
      type: Date
    }
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'email', 'phone', 'api'],
    default: 'web'
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// VIRTUALS
// ============================================================

ticketSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

ticketSchema.virtual('isOverdue').get(function() {
  if (!this.sla.resolutionDueAt) return false;
  return Date.now() > this.sla.resolutionDueAt.getTime();
});

ticketSchema.virtual('responseTimeInHours').get(function() {
  if (!this.sla.firstResponseAt) return null;
  const diff = this.sla.firstResponseAt - this.createdAt;
  return Math.round(diff / (1000 * 60 * 60) * 10) / 10;
});

// ============================================================
// INDEXES
// ============================================================

ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ customer: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ tags: 1 });
ticketSchema.index({ 'sla.resolutionDueAt': 1 });
ticketSchema.index({ priorityScore: -1 });

// Text search index
ticketSchema.index({ 
  title: 'text', 
  description: 'text', 
  'comments.message': 'text' 
});

// ============================================================
// PRE-SAVE HOOKS
// ============================================================

ticketSchema.pre('save', function(next) {
  // Set resolvedAt when status changes to resolved
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  
  // Calculate priority score
  if (this.isModified('priority') || this.isModified('status')) {
    const priorityWeights = { low: 1, medium: 2, high: 3, urgent: 4 };
    const statusWeights = { open: 5, 'in-progress': 3, resolved: 2, closed: 1 };
    this.priorityScore = (priorityWeights[this.priority] || 1) * (statusWeights[this.status] || 1);
  }
  
  next();
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Check if ticket can be edited by user
 */
ticketSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'admin') return true;
  if (userRole === 'agent' && this.assignedTo?.toString() === userId) return true;
  if (userRole === 'customer' && this.customer.toString() === userId) return true;
  return false;
};

/**
 * Check if ticket can be deleted by user
 */
ticketSchema.methods.canDelete = function(userRole) {
  return userRole === 'admin';
};

/**
 * Add comment to ticket
 */
ticketSchema.methods.addComment = function(userId, message, isInternal = false) {
  this.comments.push({
    user: userId,
    message,
    isInternal
  });
  return this;
};

/**
 * Assign ticket to agent
 */
ticketSchema.methods.assignTo = function(agentId) {
  this.assignedTo = agentId;
  if (this.status === 'open') {
    this.status = 'in-progress';
  }
  return this;
};

/**
 * Resolve ticket with resolution message
 */
ticketSchema.methods.resolve = function(resolution) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolvedAt = new Date();
  return this;
};

/**
 * Close ticket
 */
ticketSchema.methods.close = function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this;
};

/**
 * Reopen closed ticket
 */
ticketSchema.methods.reopen = function() {
  this.status = 'open';
  this.closedAt = null;
  return this;
};

/**
 * Check if ticket is active (not closed)
 */
ticketSchema.methods.isActive = function() {
  return this.status !== 'closed';
};

/**
 * Push a status change entry into statusHistory.
 * Accepts either a full user object (req.user) or a user id for `user`.
 */
ticketSchema.methods.pushStatusHistory = function({ oldStatus = null, newStatus, user, note = null } = {}) {
  const changedBy = user && typeof user === 'object' ? (user._id || user.id) : user;

  this.statusHistory.push({
    oldStatus,
    newStatus,
    changedBy,
    note,
    changedAt: new Date()
  });

  return this;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Get tickets by status with pagination
 */
ticketSchema.statics.findByStatus = function(status, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ status })
    .populate('customer', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Get tickets assigned to agent
 */
ticketSchema.statics.findAssignedTo = function(agentId, status = null) {
  const query = { assignedTo: agentId };
  if (status) query.status = status;
  return this.find(query)
    .populate('customer', 'name email')
    .sort({ priority: -1, createdAt: -1 });
};

/**
 * Get overdue tickets
 */
ticketSchema.statics.findOverdue = function() {
  return this.find({
    status: { $in: ['open', 'in-progress'] },
    'sla.resolutionDueAt': { $lt: new Date() }
  });
};

/**
 * Get dashboard statistics
 */
ticketSchema.statics.getDashboardStats = function(filters = {}) {
  const match = {};
  if (filters.customer) match.customer = filters.customer;
  if (filters.assignedTo) match.assignedTo = filters.assignedTo;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// ============================================================
// MODEL
// ============================================================

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;