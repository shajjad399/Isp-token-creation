// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { UsersIcon, TicketIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    inProgressTickets: 0,
    byRole: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.get('/stats');

      console.log('✅ Admin Stats Response:', response.data);

      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setError(error.response?.data?.message || 'Failed to load stats');
      toast.error(error.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: 'blue' },
    { title: 'Total Tickets', value: stats.totalTickets, icon: TicketIcon, color: 'purple' },
    { title: 'Open Tickets', value: stats.openTickets, icon: ClockIcon, color: 'yellow' },
    { title: 'Resolved', value: stats.resolvedTickets, icon: CheckCircleIcon, color: 'green' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stats...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load stats</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-blue-100 mt-1">Admin Dashboard - Manage your ISP system</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`stat-card-icon stat-card-icon-${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {stats.byRole && Object.keys(stats.byRole).length > 0 && (
          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Role Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{stats.byRole.admin || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admin</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{stats.byRole.agent || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Agent</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-2xl font-bold text-gray-600">{stats.byRole.customer || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/admin/users" className="block p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 transition-colors text-blue-600">
                <UsersIcon className="h-5 w-5 inline mr-2" />
                Manage Users
              </Link>
              <Link to="/tickets" className="block p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 transition-colors text-purple-600">
                <TicketIcon className="h-5 w-5 inline mr-2" />
                View All Tickets
              </Link>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Info</h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Admin</span>
                <span className="font-medium">{user?.email}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Role</span>
                <span className="font-medium text-blue-600">{user?.role}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="text-green-600">● Active</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;