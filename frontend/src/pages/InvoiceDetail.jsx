// ============================================================
// frontend/src/pages/InvoiceDetail.jsx
// ============================================================
// NEW FILE — Billing Step 3
// Description: Customer-facing single invoice view — full
// itemized receipt, payment history, print/download and a
// "Pay Now" call-to-action (real gateway lands in Step 6).
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import InvoiceReceipt from '../components/billing/InvoiceReceipt';
import {
  ArrowLeftIcon,
  PrinterIcon,
  CreditCardIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handlePayNow = () => {
    toast('Online payment is coming soon — this invoice is ready to be paid once the gateway is connected.', {
      icon: '💳'
    });
  };

  const canPay = invoice && ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status);

  return (
    <div className="space-y-6">
      {/* Header actions — hidden on print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate('/billing')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Billing
        </button>

        {invoice && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <PrinterIcon className="h-4 w-4 mr-1.5" />
              Print / Download
            </Button>
            {canPay && (
              <Button size="sm" onClick={handlePayNow}>
                <CreditCardIcon className="h-4 w-4 mr-1.5" />
                Pay Now
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
          <Link to="/billing" className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-2 inline-block">
            Go back to Billing
          </Link>
        </div>
      ) : (
        <InvoiceReceipt invoice={invoice} />
      )}
    </div>
  );
};

export default InvoiceDetail;