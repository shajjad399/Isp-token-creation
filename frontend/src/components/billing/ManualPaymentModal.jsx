// ============================================================
// frontend/src/components/billing/ManualPaymentModal.jsx
// ============================================================
// NEW FILE — Manual Payment feature
// Description: Customer-facing "Pay Now" flow. Customer sends
// money manually via bKash/Nagad/Rocket "Send Money", then
// submits the Transaction ID here. The invoice moves to
// "Pending Verification" until an admin approves the claim.
// ============================================================

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { PAYMENT_ACCOUNTS } from '../../config/company';
import { CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 })
    .format(amount || 0)
    .replace('BDT', '৳');

const METHODS = ['bkash', 'nagad', 'rocket'];

const ManualPaymentModal = ({ invoice, onClose, onSuccess }) => {
  const dueAmount = invoice ? Math.max(0, invoice.totalAmount - invoice.amountPaid) : 0;
  const [method, setMethod] = useState('bkash');
  const [form, setForm] = useState({ amount: dueAmount, transactionId: '', senderNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const account = PAYMENT_ACCOUNTS[method];

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText(account.number);
    toast.success(`${account.label} number copied`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!form.transactionId || form.transactionId.trim().length < 4) {
      toast.error('Enter a valid Transaction ID');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/billing/invoices/${invoice._id}/claim-payment`, {
        amount: Number(form.amount),
        method,
        transactionId: form.transactionId.trim(),
        senderNumber: form.senderNumber || undefined
      });
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setForm({ amount: dueAmount, transactionId: '', senderNumber: '' });
    if (submitted) {
      onSuccess();
    } else {
      onClose();
    }
  };

  if (!invoice) return null;

  return (
    <Modal isOpen={!!invoice} onClose={handleClose} title={submitted ? 'Payment Submitted' : 'Pay with Mobile Banking'} size="sm">
      {submitted ? (
        <div className="text-center py-4">
          <CheckCircleIcon className="h-14 w-14 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Submitted — Pending Verification</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            We've received your {PAYMENT_ACCOUNTS[method].label} transaction ID. Our team will verify it and mark
            your invoice as paid shortly.
          </p>
          <Button className="mt-5 w-full" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method tabs */}
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  method === m
                    ? 'text-white border-transparent'
                    : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                style={method === m ? { backgroundColor: PAYMENT_ACCOUNTS[m].color } : {}}
              >
                {PAYMENT_ACCOUNTS[m].label}
              </button>
            ))}
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-900/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Open your {account.label} app → <strong>Send Money</strong> → send {formatMoney(form.amount)} to:
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold tracking-wide text-gray-800 dark:text-white">{account.number}</span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                title="Copy number"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">{account.type} number · reference: {invoice.invoiceNumber}</p>
          </div>

          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            max={dueAmount}
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Input
            label="Transaction ID"
            placeholder="e.g. 9G7H3K2L1M"
            required
            value={form.transactionId}
            onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
          />
          <Input
            label="Your Sender Number (optional)"
            placeholder="01XXXXXXXXX"
            value={form.senderNumber}
            onChange={(e) => setForm({ ...form, senderNumber: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit Payment</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ManualPaymentModal;