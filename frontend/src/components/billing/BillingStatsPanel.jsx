// ============================================================
// frontend/src/components/billing/BillingStatsPanel.jsx
// ============================================================
// NEW FILE — Billing Step 4
// Description: Admin Billing Dashboard — sits at the top of
// AdminInvoices.jsx. Shows KPI cards, a 6-month revenue chart,
// a status breakdown donut, and an overdue-invoice watchlist.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import {
  BanknotesIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useBillingStats } from '../../hooks/useBillingStats';
import api from '../../services/api';

// ============================================================
// HELPERS
// ============================================================

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })
    .format(amount || 0)
    .replace('BDT', '৳');

const STATUS_COLOR = {
  paid: '#22c55e',
  unpaid: '#3b82f6',
  partially_paid: '#f59e0b',
  overdue: '#ef4444',
  cancelled: '#9ca3af',
  draft: '#9ca3af'
};

const STATUS_LABEL = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  draft: 'Draft'
};

const daysOverdue = (dueDate) => {
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ============================================================
// KPI CARD
// ============================================================

const KpiCard = ({ title, value, icon: Icon, tone, trend }) => {
  const tones = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1 truncate">{value}</p>
          {trend != null && (
            <p className={`flex items-center gap-1 text-xs mt-1.5 font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {trend >= 0 ? <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> : <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
              {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${tones[tone]} shadow-lg shadow-blue-500/20 flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PANEL
// ============================================================

const BillingStatsPanel = () => {
  const navigate = useNavigate();
  const { stats, loading } = useBillingStats();
  const [pendingClaims, setPendingClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [busyClaimId, setBusyClaimId] = useState(null);

  const fetchPendingClaims = async () => {
    setClaimsLoading(true);
    try {
      const response = await api.get('/billing/claims/pending');
      setPendingClaims(response.data.data);
    } catch {
      // Non-critical widget — fail silently, dashboard still works
    } finally {
      setClaimsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const handleApprove = async (invoiceId, claimId) => {
    setBusyClaimId(claimId);
    try {
      await api.patch(`/billing/invoices/${invoiceId}/claims/${claimId}/approve`, {});
      toast.success('Payment approved');
      fetchPendingClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setBusyClaimId(null);
    }
  };

  const handleReject = async (invoiceId, claimId) => {
    setBusyClaimId(claimId);
    try {
      await api.patch(`/billing/invoices/${invoiceId}/claims/${claimId}/reject`, {});
      toast.success('Payment claim rejected');
      fetchPendingClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject payment claim');
    } finally {
      setBusyClaimId(null);
    }
  };

  const growth = stats.revenueLastMonth > 0
    ? Math.round(((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 1000) / 10
    : (stats.revenueThisMonth > 0 ? 100 : 0);

  const overdueCount = stats.statusBreakdown.find((s) => s.status === 'overdue')?.count || 0;
  const pieData = stats.statusBreakdown.filter((s) => s.count > 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue This Month"
          value={formatMoney(stats.revenueThisMonth)}
          icon={BanknotesIcon}
          tone="green"
          trend={growth}
        />
        <KpiCard
          title="Total Outstanding"
          value={formatMoney(stats.totalOutstanding)}
          icon={ExclamationTriangleIcon}
          tone={stats.totalOutstanding > 0 ? 'red' : 'purple'}
        />
        <KpiCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={ChartPieIcon}
          tone="blue"
        />
        <KpiCard
          title="Overdue Invoices"
          value={overdueCount}
          icon={ExclamationTriangleIcon}
          tone={overdueCount > 0 ? 'red' : 'purple'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card-premium p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Revenue — Last 6 Months</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={(value) => [formatMoney(value), 'Collected']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status breakdown donut */}
        <div className="card-premium p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Invoices by Status</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">No invoices yet</p>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="count" nameKey="status" innerRadius={40} outerRadius={64} paddingAngle={2}>
                      {pieData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLOR[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} invoice(s)`, STATUS_LABEL[name] || name]}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                {pieData.map((s) => (
                  <div key={s.status} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[s.status] }} />
                    {STATUS_LABEL[s.status]} ({s.count})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending manual payment claims — bKash/Nagad/Rocket needing verification */}
      {!claimsLoading && pendingClaims.length > 0 && (
        <div className="card-premium p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-amber-500" />
            Pending Manual Payments — Needs Verification
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {pendingClaims.map(({ _id: invoiceId, invoiceNumber, customer, claim }) => (
              <div key={claim._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {customer?.name || '—'} <span className="text-gray-400 font-normal">· {invoiceNumber}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {claim.method?.toUpperCase()} · Txn: <span className="font-mono">{claim.transactionId}</span> · {formatMoney(claim.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleReject(invoiceId, claim._id)}
                    disabled={busyClaimId === claim._id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(invoiceId, claim._id)}
                    disabled={busyClaimId === claim._id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => navigate(`/admin/billing/${invoiceId}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue watchlist */}
      {stats.overdueInvoices.length > 0 && (
        <div className="card-premium p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            Needs Attention — Overdue Invoices
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {stats.overdueInvoices.map((inv) => (
              <button
                key={inv._id}
                onClick={() => navigate(`/admin/billing/${inv._id}`)}
                className="w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {inv.customer?.name || '—'} <span className="text-gray-400 font-normal">· {inv.invoiceNumber}</span>
                  </p>
                  <p className="text-xs text-red-500">{daysOverdue(inv.dueDate)} day(s) overdue</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white flex-shrink-0">
                  {formatMoney(inv.totalAmount - inv.amountPaid)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingStatsPanel;