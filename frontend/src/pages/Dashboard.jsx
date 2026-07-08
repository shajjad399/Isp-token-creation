// ============================================================
// frontend/src/pages/Dashboard.jsx
// ============================================================
// Description: Premium Enterprise Dashboard
// Version: 3.0.0
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import UserDashboardSkeleton from '../components/ui/UserDashboardSkeleton';
import { 
  TicketIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  PlusCircleIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// ============================================================
// ✅ CUSTOM COMPONENTS
// ============================================================

const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, delay }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl hover:shadow-gray-300/30 dark:hover:shadow-gray-800/30 transition-all duration-300"
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${colors[color]} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors[color]} shadow-lg shadow-${color}-500/30`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

const StatusBar = ({ label, value, total, color, delay }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay || 0, duration: 0.4 }}
      className="group"
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`}></span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">({percentage.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-2 rounded-full ${color} transition-all duration-500`}
        />
      </div>
    </motion.div>
  );
};

// ============================================================
// ✅ MAIN DASHBOARD
// ============================================================

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/tickets/dashboard/stats');
      
      if (response.data?.success) {
        const data = response.data.data;
        setStats(data);
        setTickets(data.recent || []);
      }
    } catch (err) {
      console.error('Dashboard Error:', err);
      setStats({
        total: 0,
        byStatus: { open: 0, 'in-progress': 0, resolved: 0, closed: 0 },
        recent: []
      });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(() => [
    { 
      title: 'Total Tickets', 
      value: stats?.total || 0, 
      icon: TicketIcon, 
      color: 'blue',
      subtitle: `${stats?.byStatus?.open || 0} open`,
      delay: 0.1
    },
    { 
      title: 'Open', 
      value: stats?.byStatus?.open || 0, 
      icon: ClockIcon, 
      color: 'yellow',
      subtitle: 'Waiting for response',
      delay: 0.2
    },
    { 
      title: 'In Progress', 
      value: stats?.byStatus?.['in-progress'] || 0, 
      icon: ArrowPathIcon, 
      color: 'purple',
      subtitle: 'Being worked on',
      delay: 0.3
    },
    { 
      title: 'Resolved', 
      value: stats?.byStatus?.resolved || 0, 
      icon: CheckCircleIcon, 
      color: 'green',
      subtitle: 'Successfully completed',
      delay: 0.4
    }
  ], [stats]);

  const statusItems = [
    { label: 'Open', value: stats?.byStatus?.open || 0, color: 'bg-blue-500', delay: 0.1 },
    { label: 'In Progress', value: stats?.byStatus?.['in-progress'] || 0, color: 'bg-yellow-500', delay: 0.2 },
    { label: 'Resolved', value: stats?.byStatus?.resolved || 0, color: 'bg-green-500', delay: 0.3 },
    { label: 'Closed', value: stats?.byStatus?.closed || 0, color: 'bg-gray-500', delay: 0.4 }
  ];

  const total = stats?.total || 1;

  // Loading State
  if (loading) {
    return <UserDashboardSkeleton />;
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Failed to load dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ============================================================
          WELCOME BANNER - Premium Design
          ============================================================ */}
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-500"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <SparklesIcon className="h-6 w-6 text-yellow-300" />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Welcome back!
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {user?.name} 👋
              </h1>
              <p className="text-blue-100 mt-2 text-lg">
                Here's what's happening with your tickets today.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
              <button 
                onClick={() => setSelectedTimeframe('week')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedTimeframe === 'week' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setSelectedTimeframe('month')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedTimeframe === 'month' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setSelectedTimeframe('year')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedTimeframe === 'year' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================
          STATS GRID - Premium Cards
          ============================================================ */}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* ============================================================
          STATUS DISTRIBUTION & QUICK ACTIONS
          ============================================================ */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-500" />
              Ticket Status Distribution
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Total: {total} tickets
            </span>
          </div>
          <div className="space-y-4">
            {statusItems.map((item) => (
              <StatusBar 
                key={item.label} 
                {...item} 
                total={total}
              />
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link to="/tickets/create">
              <button className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <PlusCircleIcon className="h-5 w-5" />
                  Create New Ticket
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
            <Link to="/tickets">
              <button className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2">
                <TicketIcon className="h-5 w-5" />
                View All Tickets
              </button>
            </Link>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================================
          RECENT TICKETS - Premium Table
          ============================================================ */}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-blue-500" />
            Recent Tickets
          </h3>
          <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 group">
            View All
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <AnimatePresence>
            {tickets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TicketIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No tickets found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first ticket to get started</p>
                <Link to="/tickets/create">
                  <button className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                    Create Ticket
                  </button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 5).map((ticket, index) => {
                  const statusColors = {
                    'open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    'resolved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'closed': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  };
                  
                  const statusDotColors = {
                    'open': 'bg-blue-500',
                    'in-progress': 'bg-yellow-500',
                    'resolved': 'bg-green-500',
                    'closed': 'bg-gray-500'
                  };

                  return (
                    <motion.div
                      key={ticket._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {ticket.ticketId?.slice(-4) || 'N/A'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {ticket.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              #{ticket.ticketId} • {ticket.customer?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                            {ticket.status === 'in-progress' ? 'In Progress' : ticket.status}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(ticket.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${statusDotColors[ticket.status]} flex-shrink-0`}></span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;