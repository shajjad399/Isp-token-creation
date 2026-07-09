// ============================================================
// frontend/src/components/billing/RecordPaymentModal.jsx
// ============================================================
// NEW FILE — Billing Step 3
// Description: Shared "record manual payment" modal, extracted
// from AdminInvoices so it can also be used on AdminInvoiceDetail.
// ============================================================

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })
    .format(amount || 0)
    .replace('BDT', '৳');

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' }
];

const RecordPaymentModal = ({ invoice, onClose, onSuccess }) => {
  const dueAmount = invoice ? invoice.totalAmount - invoice.amountPaid : 0;
  const [form, setForm] = useState({ amount: dueAmount, method: 'cash', reference: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      setForm({ amount: invoice.totalAmount - invoice.amountPaid, method: 'cash', reference: '', note: '' });
    }
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/billing/invoices/${invoice._id}/payment`, {
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference || undefined,
        note: form.note || undefined
      });
      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal isOpen={!!invoice} onClose={onClose} title={`Record Payment — ${invoice.invoiceNumber}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Due amount: <span className="font-semibold text-gray-800 dark:text-white">{formatMoney(dueAmount)}</span>
        </p>
        <Input
          label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <Select
          label="Payment Method"
          options={PAYMENT_METHODS}
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
        />
        <Input
          label="Reference / Transaction ID"
          placeholder="Optional"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
        />
        <Input
          label="Note"
          placeholder="Optional"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;