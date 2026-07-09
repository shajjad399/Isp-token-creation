// ============================================================
// backend/src/models/Invoice.js
// ============================================================
// NEW FILE — Billing Step 1
// Description: Invoice schema & model — foundation of the
// Billing & Payment module.
// ============================================================

import mongoose from 'mongoose';
import { INVOICE_STATUS, PAYMENT_METHODS } from '../constants/invoiceStatus.js';

// ============================================================
// INVOICE ITEM SUB-SCHEMA
// ============================================================

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [150, 'Item description cannot exceed 150 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Item amount is required'],
    min: [0, 'Item amount cannot be negative']
  }
}, { _id: false });

// ============================================================
// PAYMENT RECORD SUB-SCHEMA (manual/offline payments logged by admin)
// ============================================================

const paymentRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than 0']
  },
  method: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    default: PAYMENT_METHODS.CASH
  },
  reference: {
    type: String,
    trim: true,
    default: null
  },
  note: {
    type: String,
    trim: true,
    maxlength: [300, 'Note cannot exceed 300 characters']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// ============================================================
// INVOICE SCHEMA
// ============================================================

const invoiceSchema = new mongoose.Schema({
  // Identification
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Relationships
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
    index: true
  },

  // Billing period this invoice covers (e.g. 1 calendar month of service)
  billingPeriod: {
    start: {
      type: Date,
      required: [true, 'Billing period start date is required']
    },
    end: {
      type: Date,
      required: [true, 'Billing period end date is required']
    }
  },

  // Line items (package fee, VAT, late fee, discount line, etc.)
  items: {
    type: [invoiceItemSchema],
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'Invoice must have at least one item'
    }
  },

  // Amounts
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },

  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },

  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },

  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },

  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid cannot be negative']
  },

  currency: {
    type: String,
    default: 'BDT'
  },

  // Status
  status: {
    type: String,
    enum: Object.values(INVOICE_STATUS),
    default: INVOICE_STATUS.UNPAID,
    index: true
  },

  // Dates
  issueDate: {
    type: Date,
    default: Date.now
  },

  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },

  paidAt: {
    type: Date,
    default: null
  },

  // Payment history (supports partial payments)
  payments: [paymentRecordSchema],

  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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

invoiceSchema.virtual('dueAmount').get(function () {
  return Math.max(0, Math.round((this.totalAmount - this.amountPaid) * 100) / 100);
});

invoiceSchema.virtual('isOverdue').get(function () {
  if ([INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED, INVOICE_STATUS.DRAFT].includes(this.status)) {
    return false;
  }
  return Date.now() > new Date(this.dueDate).getTime();
});

// ============================================================
// INDEXES
// ============================================================

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ customer: 1, status: 1 });

// ============================================================
// PRE-SAVE HOOKS
// ============================================================

invoiceSchema.pre('save', function (next) {
  // Auto-calculate subtotal from items when items change
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  }

  // Auto-calculate totalAmount whenever the pieces change
  if (this.isModified('items') || this.isModified('discount') || this.isModified('tax')) {
    const total = (this.subtotal || 0) - (this.discount || 0) + (this.tax || 0);
    this.totalAmount = Math.max(0, Math.round(total * 100) / 100);
  }

  // Auto-derive status from amountPaid / dueDate, unless manually
  // set to draft or cancelled (those are admin-controlled terminal-ish states)
  if (![INVOICE_STATUS.DRAFT, INVOICE_STATUS.CANCELLED].includes(this.status)) {
    if (this.amountPaid >= this.totalAmount && this.totalAmount > 0) {
      this.status = INVOICE_STATUS.PAID;
      if (!this.paidAt) this.paidAt = new Date();
    } else if (this.amountPaid > 0) {
      this.status = INVOICE_STATUS.PARTIALLY_PAID;
    } else if (new Date() > new Date(this.dueDate)) {
      this.status = INVOICE_STATUS.OVERDUE;
    } else {
      this.status = INVOICE_STATUS.UNPAID;
    }
  }

  next();
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Record a payment (full or partial) against this invoice.
 */
invoiceSchema.methods.recordPayment = function ({ amount, method, reference, note, recordedBy }) {
  this.payments.push({ amount, method, reference, note, recordedBy, paidAt: new Date() });
  this.amountPaid = Math.round((this.amountPaid + amount) * 100) / 100;
  return this;
};

/**
 * Check if a user can view this invoice.
 */
invoiceSchema.methods.canView = function (userId, userRole) {
  if (userRole === 'admin' || userRole === 'agent') return true;
  return this.customer.toString() === userId;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Generate a unique, human-readable invoice number.
 * Format: INV-YYYYMM-XXXX
 */
invoiceSchema.statics.generateInvoiceNumber = async function () {
  const date = new Date();
  const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await this.countDocuments({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${period}-${sequence}`;
};

/**
 * Get billing summary for a single customer — used by the
 * customer-facing Billing page (total due, paid this year, overdue count).
 */
invoiceSchema.statics.getCustomerSummary = async function (customerId) {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [dueAgg, paidAgg, overdueCount, nextDue] = await Promise.all([
    this.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), status: { $in: [INVOICE_STATUS.UNPAID, INVOICE_STATUS.PARTIALLY_PAID, INVOICE_STATUS.OVERDUE] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$amountPaid'] } } } }
    ]),
    this.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]),
    this.countDocuments({ customer: customerId, status: INVOICE_STATUS.OVERDUE }),
    this.findOne({
      customer: customerId,
      status: { $in: [INVOICE_STATUS.UNPAID, INVOICE_STATUS.PARTIALLY_PAID, INVOICE_STATUS.OVERDUE] }
    }).sort({ dueDate: 1 }).select('dueDate totalAmount amountPaid invoiceNumber')
  ]);

  return {
    totalDue: dueAgg[0]?.total || 0,
    totalPaidThisYear: paidAgg[0]?.total || 0,
    overdueCount,
    nextDue: nextDue ? {
      invoiceNumber: nextDue.invoiceNumber,
      dueDate: nextDue.dueDate,
      amount: nextDue.totalAmount - nextDue.amountPaid
    } : null
  };
};

// ============================================================
// MODEL
// ============================================================

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;