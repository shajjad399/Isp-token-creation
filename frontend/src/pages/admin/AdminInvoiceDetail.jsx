// ============================================================
// frontend/src/pages/admin/AdminInvoiceDetail.jsx
// ============================================================
// NEW FILE — Billing Step 3
// Description: Admin single-invoice view — same professional
// receipt layout as the customer page, plus admin actions
// (record payment, cancel, delete draft, print/download).
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import InvoiceReceipt from '../../components/billing/InvoiceReceipt';
import RecordPaymentModal from '../../components/billing/RecordPaymentModal';
import {
  ArrowLeftIcon,
  PrinterIcon,
  BanknotesIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AdminInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/billing/invoices/${id}`);
      setInvoice(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleCancel = async () => {
    if (!window.confirm(`Cancel invoice ${invoice.invoiceNumber}?`)) return;
    setBusy(true);
    try {
      await api.patch(`/billing/invoices/${invoice._id}/cancel`, {});
      toast.success('Invoice cancelled');
      fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invoice');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete draft invoice ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.delete(`/billing/invoices/${invoice._id}`);
      toast.success('Invoice deleted');
      navigate('/admin/billing');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
      setBusy(false);
    }
  };

  // ✅ Recurring invoice generation — notun add kora hoyeche (Billing Step 4)
  const handleGenerateRecurring = async () => {
    if (!window.confirm(`Generate next month's invoice for ${invoice.customer?.name || 'this customer'}, based on ${invoice.invoiceNumber}?`)) return;
    setBusy(true);
    try {
      const response = await api.post(`/billing/invoices/${invoice._id}/duplicate`, {});
      toast.success(`Invoice ${response.data.data.invoiceNumber} generated`);
      navigate(`/admin/billing/${response.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate recurring invoice');
    } finally {
      setBusy(false);
    }
  };

  const canPay = invoice && ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status);
  const canCancel = invoice && !['paid', 'cancelled'].includes(invoice.status);
  const canDelete = invoice && invoice.status === 'draft';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header actions — hidden on print */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => navigate('/admin/billing')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Invoices
          </button>

          {invoice && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <PrinterIcon className="h-4 w-4 mr-1.5" />
                Print / Download
              </Button>
              {canPay && (
                <Button size="sm" onClick={() => setPaying(true)}>
                  <BanknotesIcon className="h-4 w-4 mr-1.5" />
                  Record Payment
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handleGenerateRecurring} disabled={busy}>
                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                Generate Next Invoice
              </Button>
              {canCancel && (
                <Button variant="warning" size="sm" onClick={handleCancel} disabled={busy}>
                  <XCircleIcon className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
              )}
              {canDelete && (
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={busy}>
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{error}</h3>
          </div>
        ) : (
          <InvoiceReceipt invoice={invoice} />
        )}
      </div>

      <RecordPaymentModal
        invoice={paying ? invoice : null}
        onClose={() => setPaying(false)}
        onSuccess={() => {
          setPaying(false);
          fetchInvoice();
        }}
      />
    </AdminLayout>
  );
};

export default AdminInvoiceDetail;