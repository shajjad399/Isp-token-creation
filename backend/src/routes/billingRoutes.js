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
  cancelInvoice,
  getBillingStats,
  duplicateInvoice,
  claimPayment,
  getPendingClaims,
  approveClaim,
  rejectClaim
} from '../controllers/billingController.js';
import { auth } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  cancelInvoiceSchema,
  duplicateInvoiceSchema,
  claimPaymentSchema,
  reviewClaimSchema
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
 * @route   GET /api/v1/billing/stats
 * @desc    Revenue chart data, status breakdown, collection rate, overdue watchlist
 * @access  Private/Admin+Agent — Billing Step 4
 */
router.get('/stats', role(['admin', 'agent']), getBillingStats);

/**
 * @route   GET /api/v1/billing/claims/pending
 * @desc    Watchlist of manual payment claims awaiting verification
 * @access  Private/Admin+Agent — Manual Payment feature
 */
router.get('/claims/pending', role(['admin', 'agent']), getPendingClaims);

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

/**
 * @route   POST /api/v1/billing/invoices/:id/duplicate
 * @desc    Generate the "next" recurring invoice from an existing one
 * @access  Private/Admin — Billing Step 4
 */
router.post('/invoices/:id/duplicate', role(['admin']), validate(duplicateInvoiceSchema), duplicateInvoice);

/**
 * @route   POST /api/v1/billing/invoices/:id/claim-payment
 * @desc    Customer submits a manual bKash/Nagad/Rocket payment claim
 * @access  Private/Customer — Manual Payment feature
 */
router.post('/invoices/:id/claim-payment', role(['customer']), validate(claimPaymentSchema), claimPayment);

/**
 * @route   PATCH /api/v1/billing/invoices/:id/claims/:claimId/approve
 * @desc    Approve a manual payment claim — records it as a real payment
 * @access  Private/Admin — Manual Payment feature
 */
router.patch('/invoices/:id/claims/:claimId/approve', role(['admin']), validate(reviewClaimSchema), approveClaim);

/**
 * @route   PATCH /api/v1/billing/invoices/:id/claims/:claimId/reject
 * @desc    Reject a manual payment claim
 * @access  Private/Admin — Manual Payment feature
 */
router.patch('/invoices/:id/claims/:claimId/reject', role(['admin']), validate(reviewClaimSchema), rejectClaim);

export default router;