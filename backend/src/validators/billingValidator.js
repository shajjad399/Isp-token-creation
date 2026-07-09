// backend/src/validators/billingValidator.js
// ============================================================
// NEW FILE — Billing Step 1
// ============================================================

import Joi from 'joi';
import { PAYMENT_METHODS } from '../constants/invoiceStatus.js';

const objectId = Joi.string().hex().length(24);

const invoiceItemSchema = Joi.object({
  description: Joi.string().trim().min(2).max(150).required(),
  amount: Joi.number().min(0).required()
});

/**
 * Create invoice validation schema (Admin only)
 */
export const createInvoiceSchema = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer is required',
    'string.length': 'Invalid customer id'
  }),

  billingPeriod: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().min(Joi.ref('start')).required()
  }).required(),

  items: Joi.array().items(invoiceItemSchema).min(1).required().messages({
    'array.min': 'At least one invoice item is required'
  }),

  discount: Joi.number().min(0).default(0),
  tax: Joi.number().min(0).default(0),

  dueDate: Joi.date().required().messages({
    'any.required': 'Due date is required'
  }),

  notes: Joi.string().trim().max(500).allow('', null)
});

/**
 * Update invoice validation schema (Admin only, draft/unpaid invoices)
 */
export const updateInvoiceSchema = Joi.object({
  billingPeriod: Joi.object({
    start: Joi.date(),
    end: Joi.date()
  }),

  items: Joi.array().items(invoiceItemSchema).min(1),

  discount: Joi.number().min(0),
  tax: Joi.number().min(0),
  dueDate: Joi.date(),
  notes: Joi.string().trim().max(500).allow('', null)
}).min(1);

/**
 * Record payment validation schema (Admin only — manual/offline payments)
 */
export const recordPaymentSchema = Joi.object({
  amount: Joi.number().greater(0).required().messages({
    'number.greater': 'Payment amount must be greater than 0',
    'any.required': 'Payment amount is required'
  }),
  method: Joi.string().valid(...Object.values(PAYMENT_METHODS)).default(PAYMENT_METHODS.CASH),
  reference: Joi.string().trim().max(100).allow('', null),
  note: Joi.string().trim().max(300).allow('', null)
});

/**
 * Cancel invoice validation schema
 */
export const cancelInvoiceSchema = Joi.object({
  reason: Joi.string().trim().max(300).allow('', null)
});