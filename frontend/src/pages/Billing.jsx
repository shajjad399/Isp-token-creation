// ============================================================
// frontend/src/pages/Billing.jsx
// ============================================================
// NEW FILE — Billing Step 1
// Description: Customer-facing Billing & Payments page.
// Shows outstanding dues, payment summary and invoice history.
// "Pay Now" is wired up as a call-to-action placeholder — the
// actual gateway (bKash/Nagad/SSLCommerz) lands in a later step.
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useBilling } from '../hooks/useBilling';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ReceiptPercentIcon,
  ArrowDownTrayIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

// ============================================================
// HELPERS
// ============================================================

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })
    .format(amount || 0)
    .replace('BDT', '৳');

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const STATUS_VARIANT = {
  paid: 'success',
  unpaid: 'primary',
  partially_paid: 'warning',
  overdue: 'danger',
  cancelled: 'default',
  draft: 'default'
};

const STATUS_LABEL = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  draft: 'Draft'
};

// ============================================================
// SUMMARY CARD
// ============================================================

const SummaryCard = ({ title, value, icon: Icon, color, subtitle, delay = 0 }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Card className="p-6" hover={false}>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1 truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors[color]} shadow-lg shadow-blue-500/20 flex-shrink-0`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================================
// INVOICE ROW (mobile card + desktop table row in one component)
// ============================================================

const InvoiceRow = ({ invoice, onPayNow, index }) => {
  const navigate = useNavigate();
  const dueAmount = invoice.totalAmount - invoice.amountPaid;
  const canPay = ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <Card className="p-4 md:p-5" hover>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Invoice identity — click to open the full receipt (Billing Step 3) */}
          <button
            onClick={() => navigate(`/billing/${invoice._id}`)}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {invoice.invoiceNumber}
              </span>
              <Badge variant={STATUS_VARIANT[invoice.status]}>{STATUS_LABEL[invoice.status]}</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(invoice.billingPeriod?.start)} – {formatDate(invoice.billingPeriod?.end)}
            </p>
          </button>

          {/* Due date */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 md:w-40">
            <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
            <span>Due {formatDate(invoice.dueDate)}</span>
          </div>

          {/* Amount */}
          <div className="md:w-36 md:text-right">
            <p className="text-lg font-bold text-gray-800 dark:text-white">{formatMoney(invoice.totalAmount)}</p>
            {dueAmount > 0 && invoice.status !== 'cancelled' && (
              <p className="text-xs text-red-500">{formatMoney(dueAmount)} due</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:w-40 md:justify-end">
            {canPay && (
              <Button size="sm" onClick={() => onPayNow(invoice)} className="whitespace-nowrap">
                <CreditCardIcon className="h-4 w-4 mr-1.5" />
                Pay Now
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="whitespace-nowrap"
              onClick={() => navigate(`/billing/${invoice._id}`)}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
              Receipt
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================

const Billing = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const { invoices, summary, loading, fetchInvoices } = useBilling();

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    fetchInvoices({ status: value || undefined });
  };

  // Placeholder — real gateway (bKash/Nagad/SSLCommerz) arrives in a later step.
  const handlePayNow = (invoice) => {
    toast('Online payment is coming soon — this invoice is ready to be paid once the gateway is connected.', {
      icon: '💳'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Billing &amp; Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your invoices, dues, and payment history in one place.
          </p>
        </div>
        {summary.nextDue && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2.5 rounded-xl text-sm font-medium">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            Next due {formatMoney(summary.nextDue.amount)} on {formatDate(summary.nextDue.dueDate)}
          </div>
        )}
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Due"
          value={formatMoney(summary.totalDue)}
          icon={BanknotesIcon}
          color={summary.totalDue > 0 ? 'red' : 'green'}
          subtitle={summary.totalDue > 0 ? 'Across all unpaid invoices' : 'All caught up'}
          delay={0}
        />
        <SummaryCard
          title="Paid This Year"
          value={formatMoney(summary.totalPaidThisYear)}
          icon={CheckCircleIcon}
          color="green"
          subtitle="Total settled so far"
          delay={0.05}
        />
        <SummaryCard
          title="Overdue Invoices"
          value={summary.overdueCount}
          icon={ReceiptPercentIcon}
          color={summary.overdueCount > 0 ? 'red' : 'purple'}
          subtitle={summary.overdueCount > 0 ? 'Needs attention' : 'None right now'}
          delay={0.1}
        />
      </div>

      {/* Filters */}
      <Card className="p-4" hover={false}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
          <Select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="max-w-[220px]"
            options={[
              { value: '', label: 'All invoices' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'paid', label: 'Paid' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
        </div>
      </Card>

      {/* Invoice list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center" hover={false}>
          <ReceiptPercentIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">No invoices yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your invoices will show up here once billing starts for your account.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice, index) => (
            <InvoiceRow key={invoice._id} invoice={invoice} index={index} onPayNow={handlePayNow} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Billing;