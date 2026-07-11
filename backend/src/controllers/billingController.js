// ============================================================
// backend/src/controllers/billingController.js
// ============================================================
// NEW FILE — Billing Step 1
// Description: Billing & Invoice controller
// ============================================================

import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getPaginationParams } from '../utils/helpers.js';
import { INVOICE_STATUS } from '../constants/invoiceStatus.js';
import logger from '../config/logger.js';
import { createAndSendNotification, notifyAdmins } from '../services/notificationService.js';
import { NOTIFICATION_TYPES } from '../models/Notification.js';

// ============================================================
// Small helper — consistent, professional BDT money formatting
// used inside notification titles/messages across this file.
// ============================================================
const formatMoney = (amount = 0) =>
  `৳${Math.round((amount || 0) * 100) / 100}`.replace(/\.0+$/, '');

// ============================================================
// CREATE INVOICE (Admin only)
// ============================================================
export const createInvoice = async (req, res, next) => {
  try {
    const { customer, billingPeriod, items, discount, tax, dueDate, notes } = req.body;

    const customerExists = await User.findById(customer);
    if (!customerExists) {
      throw new ApiError(404, 'Customer not found');
    }

    const invoiceNumber = await Invoice.generateInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      customer,
      billingPeriod,
      items,
      discount: discount || 0,
      tax: tax || 0,
      dueDate,
      notes,
      createdBy: req.user.id
    });

    await invoice.save();
    await invoice.populate('customer', 'name email phone');

    logger.info(`✅ Invoice created: ${invoice.invoiceNumber} for customer ${customer}`);

    // Notify the customer immediately, telling them exactly how much they owe
    // and by when — this is the trigger point for "you have a due amount".
    if (invoice.status !== INVOICE_STATUS.DRAFT) {
      await createAndSendNotification({
        user: invoice.customer._id,
        type: NOTIFICATION_TYPES.INVOICE_CREATED,
        title: 'New Invoice Issued',
        message: `Invoice ${invoice.invoiceNumber} has been generated. You have ${formatMoney(invoice.dueAmount)} due by ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.`,
        relatedInvoice: invoice._id,
        priority: 'high',
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          dueAmount: invoice.dueAmount,
          dueDate: invoice.dueDate
        }
      }).catch((err) => logger.error('Failed to send invoice-created notification:', err));
    }

    res.status(201).json(
      ApiResponse.success(invoice, 'Invoice created successfully', 201)
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET INVOICES (role-aware: customer sees own, admin/agent see all)
// ============================================================
export const getInvoices = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, search, dateFrom, dateTo, customer } = req.query;

    const query = {};

    // Customers can only ever see their own invoices
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (customer) {
      query.customer = customer;
    }

    if (status) query.status = status;

    if (dateFrom || dateTo) {
      query.issueDate = {};
      if (dateFrom) query.issueDate.$gte = new Date(dateFrom);
      if (dateTo) query.issueDate.$lte = new Date(dateTo);
    }

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query)
    ]);

    res.status(200).json(
      ApiResponse.success({
        invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Invoices fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET BILLING SUMMARY (customer's own dashboard summary)
// ============================================================
export const getBillingSummary = async (req, res, next) => {
  try {
    // Customer নিজের summary দেখবে
    if (req.user.role === 'customer') {
      const summary = await Invoice.getCustomerSummary(req.user.id);

      return res.status(200).json(
        ApiResponse.success(summary, 'Billing summary fetched successfully')
      );
    }

    // Admin/Agent নির্দিষ্ট customer-এর summary চাইলে
    if (req.query.customer) {
      const summary = await Invoice.getCustomerSummary(req.query.customer);

      return res.status(200).json(
        ApiResponse.success(summary, 'Billing summary fetched successfully')
      );
    }

    // Admin/Agent হলে সব invoice-এর summary
    const summary = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$dueAmount' },
          totalPaidThisYear: { $sum: '$amountPaid' },
          overdueCount: {
            $sum: {
              $cond: [{ $eq: ['$status', INVOICE_STATUS.OVERDUE] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.status(200).json(
      ApiResponse.success(
        summary[0] || {
          totalDue: 0,
          totalPaidThisYear: 0,
          overdueCount: 0
        },
        'Billing summary fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET INVOICE BY ID
// ============================================================
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('payments.recordedBy', 'name');

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (!invoice.canView(req.user.id, req.user.role)) {
      throw new ApiError(403, 'Access denied');
    }

    res.status(200).json(
      ApiResponse.success(invoice, 'Invoice fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE INVOICE (Admin only)
// ============================================================
export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if ([INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED].includes(invoice.status)) {
      throw new ApiError(400, `Cannot edit an invoice that is already ${invoice.status}`);
    }

    const allowedFields = ['billingPeriod', 'items', 'discount', 'tax', 'dueDate', 'notes'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) invoice[field] = req.body[field];
    });
    invoice.updatedBy = req.user.id;

    await invoice.save();
    await invoice.populate('customer', 'name email phone');

    res.status(200).json(
      ApiResponse.success(invoice, 'Invoice updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE INVOICE (Admin only — only draft invoices)
// ============================================================
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status !== INVOICE_STATUS.DRAFT && invoice.amountPaid > 0) {
      throw new ApiError(400, 'Cannot delete an invoice that already has payments. Cancel it instead.');
    }

    await invoice.deleteOne();

    res.status(200).json(
      ApiResponse.success(null, 'Invoice deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// RECORD PAYMENT (Admin only — manual/offline payment logging)
// This is the hook that Step 5 (payment gateway) will also call
// automatically once bKash/Nagad/SSLCommerz webhooks are wired in.
// ============================================================
export const recordPayment = async (req, res, next) => {
  try {
    const { amount, method, reference, note } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      throw new ApiError(400, 'Cannot record payment on a cancelled invoice');
    }

    if (amount > invoice.dueAmount) {
      throw new ApiError(400, `Payment amount exceeds the due amount (${invoice.dueAmount})`);
    }

    invoice.recordPayment({ amount, method, reference, note, recordedBy: req.user.id });
    invoice.updatedBy = req.user.id;

    await invoice.save();
    await invoice.populate('customer', 'name email phone');

    logger.info(`💰 Payment recorded on ${invoice.invoiceNumber}: ${amount} (${method})`);

    // Let the customer know their payment landed, and what (if anything) is still due
    const remaining = invoice.dueAmount;
    await createAndSendNotification({
      user: invoice.customer._id,
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: remaining > 0
        ? `We've recorded ${formatMoney(amount)} against ${invoice.invoiceNumber}. Remaining due: ${formatMoney(remaining)}.`
        : `We've recorded ${formatMoney(amount)} against ${invoice.invoiceNumber}. Your invoice is now fully paid — thank you!`,
      relatedInvoice: invoice._id,
      priority: 'medium',
      metadata: { invoiceNumber: invoice.invoiceNumber, amount, remaining }
    }).catch((err) => logger.error('Failed to send payment-received notification:', err));

    res.status(200).json(
      ApiResponse.success(invoice, 'Payment recorded successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SUBMIT MANUAL PAYMENT CLAIM (Customer — bKash/Nagad/Rocket)
// Customer sends money manually to the ISP's mobile wallet, then
// submits the Transaction ID here. Invoice is NOT marked paid yet —
// it goes to "pending verification" until an admin approves it.
// ============================================================
export const claimPayment = async (req, res, next) => {
  try {
    const { amount, method, transactionId, senderNumber } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Customers may only claim payment on their own invoice
    if (req.user.role === 'customer' && invoice.customer.toString() !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to pay this invoice');
    }

    if ([INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED, INVOICE_STATUS.DRAFT].includes(invoice.status)) {
      throw new ApiError(400, `Cannot submit a payment claim on a ${invoice.status} invoice`);
    }

    const alreadyClaimed = invoice.paymentClaims.some(
      (c) => c.transactionId.toLowerCase() === transactionId.toLowerCase() && c.status !== 'rejected'
    );
    if (alreadyClaimed) {
      throw new ApiError(409, 'This transaction ID has already been submitted for this invoice');
    }

    invoice.paymentClaims.push({
      amount,
      method,
      transactionId,
      senderNumber,
      status: 'pending',
      submittedBy: req.user.id,
      submittedAt: new Date()
    });

    await invoice.save();
    await invoice.populate('customer', 'name email phone');

    logger.info(`🧾 Manual payment claim submitted on ${invoice.invoiceNumber}: ${amount} via ${method} (${transactionId})`);

    // ✅ Notify admins that a bill payment needs verification (Payment
    // tab of the admin notification bell).
    notifyAdmins({
      type: NOTIFICATION_TYPES.PAYMENT_CLAIM_SUBMITTED,
      title: 'New Payment Claim',
      message: `${invoice.customer?.name || 'A customer'} submitted a ${formatMoney(amount)} payment claim via ${method} for invoice ${invoice.invoiceNumber} — awaiting verification.`,
      relatedInvoice: invoice._id,
      priority: 'high',
      metadata: { invoiceNumber: invoice.invoiceNumber, amount, method, transactionId }
    }, { excludeUserId: req.user.id }).catch((err) =>
      logger.error('Failed to send payment-claim notification to admins:', err)
    );

    res.status(201).json(
      ApiResponse.success(invoice, 'Payment submitted successfully — awaiting verification', 201)
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PENDING PAYMENT CLAIMS WATCHLIST (Admin/Agent)
// ============================================================
export const getPendingClaims = async (req, res, next) => {
  try {
    const claims = await Invoice.getPendingClaims(20);

    res.status(200).json(
      ApiResponse.success(claims, 'Pending payment claims fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// APPROVE MANUAL PAYMENT CLAIM (Admin only)
// Verifies the transaction ID was checked and moves the claim
// into the real payment ledger, which recalculates invoice status.
// ============================================================
export const approveClaim = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    const claim = invoice.paymentClaims.id(req.params.claimId);

    if (!claim) {
      throw new ApiError(404, 'Payment claim not found');
    }

    if (claim.status !== 'pending') {
      throw new ApiError(400, `This claim has already been ${claim.status}`);
    }

    const payableAmount = Math.min(claim.amount, invoice.dueAmount || claim.amount);

    invoice.recordPayment({
      amount: payableAmount,
      method: claim.method,
      reference: claim.transactionId,
      note: `Verified manual ${claim.method} payment${claim.senderNumber ? ` from ${claim.senderNumber}` : ''}`,
      recordedBy: req.user.id
    });

    claim.status = 'approved';
    claim.reviewedBy = req.user.id;
    claim.reviewedAt = new Date();
    claim.reviewNote = req.body.reviewNote || undefined;

    invoice.updatedBy = req.user.id;

    await invoice.save();
    await invoice.populate('customer', 'name email phone');

    logger.info(`✅ Manual payment claim approved on ${invoice.invoiceNumber}: ${payableAmount} via ${claim.method}`);

    // Confirm to the customer that their bKash/Nagad/Rocket claim was verified
    const remainingAfterClaim = invoice.dueAmount;
    await createAndSendNotification({
      user: invoice.customer._id,
      type: NOTIFICATION_TYPES.PAYMENT_CLAIM_APPROVED,
      title: 'Payment Verified',
      message: remainingAfterClaim > 0
        ? `Your ${claim.method} payment of ${formatMoney(payableAmount)} for ${invoice.invoiceNumber} has been verified. Remaining due: ${formatMoney(remainingAfterClaim)}.`
        : `Your ${claim.method} payment of ${formatMoney(payableAmount)} for ${invoice.invoiceNumber} has been verified. Your invoice is now fully paid — thank you!`,
      relatedInvoice: invoice._id,
      priority: 'medium',
      metadata: { invoiceNumber: invoice.invoiceNumber, amount: payableAmount, remaining: remainingAfterClaim }
    }).catch((err) => logger.error('Failed to send claim-approved notification:', err));

    res.status(200).json(
      ApiResponse.success(invoice, 'Payment claim approved and recorded successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REJECT MANUAL PAYMENT CLAIM (Admin only)
// ============================================================
export const rejectClaim = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    const claim = invoice.paymentClaims.id(req.params.claimId);

    if (!claim) {
      throw new ApiError(404, 'Payment claim not found');
    }

    if (claim.status !== 'pending') {
      throw new ApiError(400, `This claim has already been ${claim.status}`);
    }

    claim.status = 'rejected';
    claim.reviewedBy = req.user.id;
    claim.reviewedAt = new Date();
    claim.reviewNote = req.body.reviewNote || undefined;

    await invoice.save();
    await invoice.populate('customer', 'name email phone');

    logger.info(`❌ Manual payment claim rejected on ${invoice.invoiceNumber} (${claim.transactionId})`);

    await createAndSendNotification({
      user: invoice.customer._id,
      type: NOTIFICATION_TYPES.PAYMENT_CLAIM_REJECTED,
      title: 'Payment Could Not Be Verified',
      message: `Your ${claim.method} payment claim (Txn: ${claim.transactionId}) for ${invoice.invoiceNumber} could not be verified${claim.reviewNote ? `: ${claim.reviewNote}` : '. Please double-check the transaction ID and try again.'}`,
      relatedInvoice: invoice._id,
      priority: 'high',
      metadata: { invoiceNumber: invoice.invoiceNumber, transactionId: claim.transactionId }
    }).catch((err) => logger.error('Failed to send claim-rejected notification:', err));

    res.status(200).json(
      ApiResponse.success(invoice, 'Payment claim rejected')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CANCEL INVOICE (Admin only)
// ============================================================
export const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status === INVOICE_STATUS.PAID) {
      throw new ApiError(400, 'Cannot cancel an invoice that is already paid');
    }

    invoice.status = INVOICE_STATUS.CANCELLED;
    invoice.notes = req.body.reason
      ? `${invoice.notes ? invoice.notes + ' | ' : ''}Cancelled: ${req.body.reason}`
      : invoice.notes;
    invoice.updatedBy = req.user.id;

    await invoice.save();

    res.status(200).json(
      ApiResponse.success(invoice, 'Invoice cancelled successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// BILLING STATS (Admin/Agent dashboard — Billing Step 4)
// Powers the revenue chart, status breakdown, collection rate
// and overdue watchlist on the Admin Billing page.
// ============================================================
export const getBillingStats = async (req, res, next) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [statusBreakdownAgg, monthlyRevenueAgg, totals, overdueInvoices, thisMonthAgg, lastMonthAgg] = await Promise.all([
      // Invoice count + face value grouped by status
      Invoice.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } }
      ]),

      // Collected revenue per month (based on when payments were actually recorded)
      Invoice.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.paidAt': { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$payments.paidAt' }, month: { $month: '$payments.paidAt' } },
            total: { $sum: '$payments.amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Overall totals for collection rate + outstanding balance
      Invoice.aggregate([
        { $match: { status: { $ne: INVOICE_STATUS.DRAFT } } },
        {
          $group: {
            _id: null,
            totalInvoiced: { $sum: '$totalAmount' },
            totalCollected: { $sum: '$amountPaid' }
          }
        }
      ]),

      // Watchlist — invoices most urgently overdue
      Invoice.find({ status: INVOICE_STATUS.OVERDUE })
        .populate('customer', 'name email phone')
        .sort({ dueDate: 1 })
        .limit(8)
        .select('invoiceNumber customer totalAmount amountPaid dueDate'),

      Invoice.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.paidAt': { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } }
      ]),

      Invoice.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.paidAt': { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } }
      ])
    ]);

    // --- Build a full 6-month series, filling gaps with 0 so the chart never breaks
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap = new Map(
      monthlyRevenueAgg.map((row) => [`${row._id.year}-${row._id.month}`, row.total])
    );
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyRevenue.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        revenue: Math.round((revenueMap.get(key) || 0) * 100) / 100
      });
    }

    const statusBreakdown = Object.values(INVOICE_STATUS).map((status) => {
      const row = statusBreakdownAgg.find((r) => r._id === status);
      return { status, count: row?.count || 0, amount: row?.amount || 0 };
    });

    const totalInvoiced = totals[0]?.totalInvoiced || 0;
    const totalCollected = totals[0]?.totalCollected || 0;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 1000) / 10 : 0;
    const totalOutstanding = Math.max(0, Math.round((totalInvoiced - totalCollected) * 100) / 100);

    res.status(200).json(
      ApiResponse.success({
        monthlyRevenue,
        statusBreakdown,
        collectionRate,
        totalOutstanding,
        revenueThisMonth: thisMonthAgg[0]?.total || 0,
        revenueLastMonth: lastMonthAgg[0]?.total || 0,
        overdueInvoices
      }, 'Billing stats fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DUPLICATE / GENERATE RECURRING INVOICE (Admin only — Billing Step 4)
// Spins off the "next" invoice from an existing one: same customer,
// same line items/discount/tax, billing period rolled forward by
// one month, and a fresh due date. Handy for monthly ISP billing
// without needing a full cron-based scheduler yet.
// ============================================================
export const duplicateInvoice = async (req, res, next) => {
  try {
    const source = await Invoice.findById(req.params.id);

    if (!source) {
      throw new ApiError(404, 'Invoice not found');
    }

    const dueInDays = req.body.dueInDays || 15;

    // Roll the billing period forward by one month from where the source left off
    const newStart = new Date(source.billingPeriod.end);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);
    newEnd.setDate(newEnd.getDate() - 1);

    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + dueInDays);

    const invoiceNumber = await Invoice.generateInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      customer: source.customer,
      billingPeriod: { start: newStart, end: newEnd },
      items: source.items.map(({ description, amount }) => ({ description, amount })),
      discount: source.discount || 0,
      tax: source.tax || 0,
      dueDate: newDueDate,
      notes: `Recurring invoice generated from ${source.invoiceNumber}`,
      createdBy: req.user.id
    });

    await invoice.save();
    await invoice.populate('customer', 'name email phone');

    logger.info(`🔁 Recurring invoice ${invoice.invoiceNumber} generated from ${source.invoiceNumber}`);

    res.status(201).json(
      ApiResponse.success(invoice, 'Recurring invoice generated successfully', 201)
    );
  } catch (error) {
    next(error);
  }
};