// frontend/src/pages/admin/AdminCreateInvoice.jsx
// ============================================================
// NEW FILE — Billing Step 2 (Admin Billing Panel)
// Description: Admin form to create a new invoice for a customer,
// with dynamic line items and a live total preview.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, XMarkIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 })
    .format(amount || 0)
    .replace('BDT', '৳');

// Default: bill for the current calendar month
const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const defaultDueDate = new Date(today.getFullYear(), today.getMonth(), 10);
const toInputDate = (d) => d.toISOString().split('T')[0];

const AdminCreateInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer: '',
    periodStart: toInputDate(startOfMonth),
    periodEnd: toInputDate(endOfMonth),
    dueDate: toInputDate(defaultDueDate),
    discount: 0,
    tax: 0,
    notes: ''
  });

  const [items, setItems] = useState([{ description: 'Monthly Internet Package', amount: '' }]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await adminApi.get('/users?role=customer&limit=500&isActive=true');
        setCustomers(response.data.data?.users || []);
      } catch (error) {
        toast.error('Failed to load customer list');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const customerOptions = customers.map((c) => ({ value: c._id, label: `${c.name} (${c.email})` }));

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const total = Math.max(0, subtotal - (Number(form.discount) || 0) + (Number(form.tax) || 0));

  const handleItemChange = (index, field, value) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const addItem = () => setItems([...items, { description: '', amount: '' }]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer) {
      toast.error('Please select a customer');
      return;
    }
    if (items.some((item) => !item.description || !item.amount)) {
      toast.error('Every item needs a description and amount');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: form.customer,
        billingPeriod: { start: form.periodStart, end: form.periodEnd },
        items: items.map((item) => ({ description: item.description, amount: Number(item.amount) })),
        discount: Number(form.discount) || 0,
        tax: Number(form.tax) || 0,
        dueDate: form.dueDate,
        notes: form.notes || undefined
      };

      const response = await api.post('/billing/invoices', payload);
      toast.success(`Invoice ${response.data.data.invoiceNumber} created successfully!`);
      navigate('/admin/billing');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Invoice</h1>
            <p className="text-gray-500 dark:text-gray-400">Bill a customer for a service period</p>
          </div>
          <button
            onClick={() => navigate('/admin/billing')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="card-premium p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Customer"
              required
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              options={customerOptions}
              disabled={loadingCustomers}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Billing Period Start"
                type="date"
                required
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              />
              <Input
                label="Billing Period End"
                type="date"
                required
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              />
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PlusIcon className="h-4 w-4" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="e.g. Monthly Internet Package (20 Mbps)"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-36">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="p-2.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Discount"
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
              <Input
                label="Tax / VAT"
                type="number"
                min="0"
                step="0.01"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
              />
            </div>

            <Input
              label="Due Date"
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />

            <Input
              label="Notes"
              placeholder="Optional note visible to the customer"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            {/* Live total preview */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                <ReceiptPercentIcon className="h-4 w-4" /> Summary
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Subtotal</span><span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Discount</span><span>- {formatMoney(form.discount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Tax</span><span>+ {formatMoney(form.tax || 0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span><span>{formatMoney(total)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/billing')}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Create Invoice
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCreateInvoice;