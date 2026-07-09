// backend/src/routes/billingRoutes.js
// ============================================================
// NEW FILE — Billing Step 1
// ============================================================

import express from 'express';
import {
  createInvoice,
  getInvoices,
  getBillingSummary,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  cancelInvoice
} from '../controllers/billingController.js';
import { auth } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  cancelInvoiceSchema
} from '../validators/billingValidator.js';

const router = express.Router();

// All billing routes require authentication
router.use(auth);

/**
 * @route   GET /api/v1/billing/invoices/summary
 * @desc    Get billing summary (total due, paid this year, overdue, next due)
 * @access  Private (customer sees own; admin/agent can pass ?customer=<id>)
 */
router.get('/invoices/summary', getBillingSummary);

/**
 * @route   GET /api/v1/billing/invoices
 * @desc    Get invoices (customer sees own, admin/agent see all with filters)
 * @access  Private
 * @query   page, limit, status, search, dateFrom, dateTo, customer
 */
router.get('/invoices', getInvoices);

/**
 * @route   POST /api/v1/billing/invoices
 * @desc    Create a new invoice
 * @access  Private/Admin
 */
router.post('/invoices', role(['admin']), validate(createInvoiceSchema), createInvoice);

/**
 * @route   GET /api/v1/billing/invoices/:id
 * @desc    Get single invoice by id
 * @access  Private (owner customer, agent, or admin)
 */
router.get('/invoices/:id', getInvoiceById);

/**
 * @route   PUT /api/v1/billing/invoices/:id
 * @desc    Update an invoice (only while unpaid/partially paid/overdue)
 * @access  Private/Admin
 */
router.put('/invoices/:id', role(['admin']), validate(updateInvoiceSchema), updateInvoice);

/**
 * @route   DELETE /api/v1/billing/invoices/:id
 * @desc    Delete a draft invoice
 * @access  Private/Admin
 */
router.delete('/invoices/:id', role(['admin']), deleteInvoice);

/**
 * @route   PATCH /api/v1/billing/invoices/:id/payment
 * @desc    Record a manual/offline payment against an invoice
 * @access  Private/Admin
 */
router.patch('/invoices/:id/payment', role(['admin']), validate(recordPaymentSchema), recordPayment);

/**
 * @route   PATCH /api/v1/billing/invoices/:id/cancel
 * @desc    Cancel an invoice
 * @access  Private/Admin
 */
router.patch('/invoices/:id/cancel', role(['admin']), validate(cancelInvoiceSchema), cancelInvoice);

export default router;