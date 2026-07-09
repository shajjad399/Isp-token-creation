// backend/src/constants/invoiceStatus.js
// ============================================================
// NEW FILE — Billing Step 1
// ============================================================

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.UNPAID]: 'Unpaid',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'Partially Paid',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.OVERDUE]: 'Overdue',
  [INVOICE_STATUS.CANCELLED]: 'Cancelled'
};

export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUS.DRAFT]: 'gray',
  [INVOICE_STATUS.UNPAID]: 'blue',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'yellow',
  [INVOICE_STATUS.PAID]: 'green',
  [INVOICE_STATUS.OVERDUE]: 'red',
  [INVOICE_STATUS.CANCELLED]: 'gray'
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  BANK: 'bank',
  CARD: 'card',
  OTHER: 'other'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.BKASH]: 'bKash',
  [PAYMENT_METHODS.NAGAD]: 'Nagad',
  [PAYMENT_METHODS.ROCKET]: 'Rocket',
  [PAYMENT_METHODS.BANK]: 'Bank Transfer',
  [PAYMENT_METHODS.CARD]: 'Card',
  [PAYMENT_METHODS.OTHER]: 'Other'
};