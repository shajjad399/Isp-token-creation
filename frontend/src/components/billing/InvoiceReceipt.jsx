// ============================================================
// frontend/src/components/billing/InvoiceReceipt.jsx
// ============================================================
// NEW FILE — Billing Step 3
// Description: Shared, print-ready invoice/receipt layout used by
// both the customer InvoiceDetail page and the AdminInvoiceDetail
// page. Renders a professional A4-style invoice with itemized
// breakdown, status ribbon, and payment history — and prints
// cleanly via window.print() (see index.css for the print rules).
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { COMPANY_INFO } from '../../config/company';

// ============================================================
// HELPERS
// ============================================================

export const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 })
    .format(amount || 0)
    .replace('BDT', '৳');

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateShort = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const STATUS_STYLES = {
  paid: { label: 'Paid', ribbon: 'bg-green-500', text: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  unpaid: { label: 'Unpaid', ribbon: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  partially_paid: { label: 'Partially Paid', ribbon: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  overdue: { label: 'Overdue', ribbon: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  cancelled: { label: 'Cancelled', ribbon: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
  draft: { label: 'Draft', ribbon: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' }
};

const PAYMENT_METHOD_LABEL = {
  cash: 'Cash',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank Transfer',
  card: 'Card',
  other: 'Other'
};

// ============================================================
// COMPONENT
// ============================================================

const InvoiceReceipt = ({ invoice }) => {
  if (!invoice) return null;

  const status = STATUS_STYLES[invoice.status] || STATUS_STYLES.draft;
  const dueAmount = Math.max(0, (invoice.totalAmount || 0) - (invoice.amountPaid || 0));

  return (
    <motion.div
      id="invoice-print-area"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none print:border-0 print:rounded-none"
    >
      {/* Status ribbon */}
      <div className={`h-1.5 w-full ${status.ribbon}`} />

      <div className="p-6 sm:p-10">
        {/* Header: company + invoice meta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-dashed border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <BuildingOffice2Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{COMPANY_INFO.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{COMPANY_INFO.tagline}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />{COMPANY_INFO.address}</p>
              <p className="flex items-center gap-1.5"><PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />{COMPANY_INFO.phone}</p>
              <p className="flex items-center gap-1.5"><EnvelopeIcon className="h-3.5 w-3.5 flex-shrink-0" />{COMPANY_INFO.email}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">INVOICE</h1>
            <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">{invoice.invoiceNumber}</p>
            <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
              {invoice.status === 'paid' && <CheckBadgeIcon className="h-3.5 w-3.5" />}
              {status.label}
            </span>
          </div>
        </div>

        {/* Bill to / dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Billed To</p>
            <p className="mt-2 font-semibold text-gray-900 dark:text-white">{invoice.customer?.name || '—'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.customer?.email}</p>
            {invoice.customer?.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.customer.phone}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Billing Period</p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {formatDateShort(invoice.billingPeriod?.start)} – {formatDateShort(invoice.billingPeriod?.end)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Issued {formatDateShort(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Due Date</p>
            <p className={`mt-2 text-sm font-semibold ${invoice.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {formatDate(invoice.dueDate)}
            </p>
            {invoice.paidAt && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Paid on {formatDateShort(invoice.paidAt)}</p>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Description</th>
                <th className="text-right font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {(invoice.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.description}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">{formatMoney(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatMoney(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Discount</span>
                <span className="text-green-600 dark:text-green-400">−{formatMoney(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Tax</span>
                <span>+{formatMoney(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 text-base font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{formatMoney(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Paid</span>
              <span className="text-green-600 dark:text-green-400">{formatMoney(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-gray-900 dark:text-white">Balance Due</span>
              <span className={dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                {formatMoney(dueAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment history */}
        {invoice.payments?.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">Payment History</p>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5">Date</th>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5">Method</th>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5">Reference</th>
                    <th className="text-right font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {invoice.payments.map((p, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatDateShort(p.paidAt)}</td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{PAYMENT_METHOD_LABEL[p.method] || p.method}</td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{p.reference || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-700 dark:text-gray-200">{formatMoney(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes + footer */}
        {invoice.notes && (
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">{COMPANY_INFO.paymentNote}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{COMPANY_INFO.website} · {COMPANY_INFO.email}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoiceReceipt;