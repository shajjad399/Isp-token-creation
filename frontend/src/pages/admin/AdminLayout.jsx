// frontend/src/pages/admin/AdminInvoices.jsx
// ============================================================
// NEW FILE — Billing Step 2 (Admin Billing Panel)
// Description: Admin view of all invoices — search, filter,
// record manual payments, cancel/delete invoices.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  XCircleIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
// ✅ Shared record-payment modal — notun add kora hoyeche (Billing Step 3)
import RecordPaymentModal from '../../components/billing/RecordPaymentModal';
// ✅ Admin Billing Dashboard panel — notun add kora hoyeche (Billing Step 4)
import BillingStatsPanel from '../../components/billing/BillingStatsPanel';

// ============================================================
// HELPERS
// ============================================================

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })
    .format(amount || 0)
    .replace('BDT', '৳');

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '—');

const STATUS_BADGE = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  unpaid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  partially_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
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
// MAIN PAGE
// ============================================================

const AdminInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/billing/invoices', { params });
      setInvoices(response.data.data.invoices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
      toast.error(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCancel = async (invoice) => {
    if (!window.confirm(`Cancel invoice ${invoice.invoiceNumber}?`)) return;
    setBusyId(invoice._id);
    try {
      await api.patch(`/billing/invoices/${invoice._id}/cancel`, {});
      toast.success('Invoice cancelled');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invoice');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm(`Delete draft invoice ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    setBusyId(invoice._id);
    try {
      await api.delete(`/billing/invoices/${invoice._id}`);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setBusyId(null);
    }
  };

  // ✅ Recurring invoice generation — notun add kora hoyeche (Billing Step 4)
  const handleGenerateRecurring = async (invoice) => {
    if (!window.confirm(`Generate next month's invoice for ${invoice.customer?.name || 'this customer'}, based on ${invoice.invoiceNumber}?`)) return;
    setBusyId(invoice._id);
    try {
      const response = await api.post(`/billing/invoices/${invoice._id}/duplicate`, {});
      toast.success(`Invoice ${response.data.data.invoiceNumber} generated`);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate recurring invoice');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing &amp; Invoices</h1>
            <p className="text-gray-500 dark:text-gray-400">Create, track and collect payment on customer invoices</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/admin/billing/create')}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Invoice
          </Button>
        </div>

        {/* ✅ Admin Billing Dashboard — notun add kora hoyeche (Billing Step 4) */}
        <BillingStatsPanel />

        {/* Filters */}
        <div className="card-premium p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
            <Button variant="primary" onClick={fetchInvoices}>Search</Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="card-premium p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button onClick={fetchInvoices} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              Retry
            </button>
          </div>
        ) : (
          <div className="card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <ReceiptPercentIcon className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => {
                      const dueAmount = invoice.totalAmount - invoice.amountPaid;
                      const canPay = ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status);
                      const canCancel = !['paid', 'cancelled'].includes(invoice.status);
                      const canDelete = invoice.status === 'draft';

                      return (
                        <tr key={invoice._id}>
                          <td className="font-medium">
                            <button
                              onClick={() => navigate(`/admin/billing/${invoice._id}`)}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </button>
                          </td>
                          <td>
                            <div className="text-gray-800 dark:text-gray-200">{invoice.customer?.name || '—'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer?.email}</div>
                          </td>
                          <td className="font-medium">{formatMoney(invoice.totalAmount)}</td>
                          <td className={dueAmount > 0 ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                            {formatMoney(dueAmount)}
                          </td>
                          <td>
                            <span className={`px-2 py-1 text-xs rounded-full ${STATUS_BADGE[invoice.status]}`}>
                              {STATUS_LABEL[invoice.status]}
                            </span>
                          </td>
                          <td className="text-gray-500 dark:text-gray-400">{formatDate(invoice.dueDate)}</td>
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/admin/billing/${invoice._id}`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View Invoice"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              {canPay && (
                                <button
                                  onClick={() => setPayingInvoice(invoice)}
                                  className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Record Payment"
                                >
                                  <BanknotesIcon className="h-5 w-5" />
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  onClick={() => handleCancel(invoice)}
                                  disabled={busyId === invoice._id}
                                  className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors disabled:opacity-50"
                                  title="Cancel Invoice"
                                >
                                  <XCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleGenerateRecurring(invoice)}
                                disabled={busyId === invoice._id}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                title="Generate Next Month's Invoice"
                              >
                                <ArrowPathIcon className="h-5 w-5" />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(invoice)}
                                  disabled={busyId === invoice._id}
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                  title="Delete Invoice"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <RecordPaymentModal
        invoice={payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onSuccess={() => {
          setPayingInvoice(null);
          fetchInvoices();
        }}
      />
    </AdminLayout>
  );
};

export default AdminInvoices;