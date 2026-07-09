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
    const customerId = req.user.role === 'customer' ? req.user.id : req.query.customer;

    if (!customerId) {
      throw new ApiError(400, 'Customer id is required');
    }

    const summary = await Invoice.getCustomerSummary(customerId);

    res.status(200).json(
      ApiResponse.success(summary, 'Billing summary fetched successfully')
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
      .populate('createdBy', 'name email');

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

    res.status(200).json(
      ApiResponse.success(invoice, 'Payment recorded successfully')
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