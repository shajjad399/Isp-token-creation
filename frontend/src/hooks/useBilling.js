// frontend/src/hooks/useBilling.js
// ============================================================
// NEW FILE — Billing Step 1
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useBilling = (initialFilters = {}) => {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    totalDue: 0,
    totalPaidThisYear: 0,
    overdueCount: 0,
    nextDue: null
  });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get('/billing/invoices/summary');
      setSummary(response.data.data);
    } catch (err) {
      // Summary failures shouldn't block the invoice list from rendering
      console.error('Failed to fetch billing summary', err);
    }
  }, []);

  const fetchInvoices = useCallback(async (newFilters = {}) => {
    setLoading(true);
    try {
      const params = { ...initialFilters, ...newFilters };
      const response = await api.get('/billing/invoices', { params });
      const { invoices, pagination } = response.data.data;
      setInvoices(invoices);
      setPagination(pagination);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch invoices';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInvoiceById = async (id) => {
    try {
      const response = await api.get(`/billing/invoices/${id}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch invoice';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    invoices,
    summary,
    pagination,
    loading,
    error,
    fetchInvoices,
    fetchSummary,
    getInvoiceById
  };
};

export default useBilling;