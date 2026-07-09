// ============================================================
// frontend/src/hooks/useBillingStats.js
// ============================================================
// NEW FILE — Billing Step 4
// Description: Fetches the admin billing analytics payload
// (revenue chart series, status breakdown, collection rate,
// outstanding balance, overdue watchlist) used by the Admin
// Billing Dashboard panel.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const EMPTY_STATS = {
  monthlyRevenue: [],
  statusBreakdown: [],
  collectionRate: 0,
  totalOutstanding: 0,
  revenueThisMonth: 0,
  revenueLastMonth: 0,
  overdueInvoices: []
};

export const useBillingStats = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/billing/stats');
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

export default useBillingStats;