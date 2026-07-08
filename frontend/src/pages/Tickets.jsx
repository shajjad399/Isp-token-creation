// frontend/src/pages/Tickets.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import SLACountdown from '../components/tickets/SLACountdown';
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const Tickets = () => {
  const { user } = useAuth();
  const { tickets, stats, loading, fetchTickets } = useTickets();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  // ============================================================
  // ✅ STATUS BADGE VARIANT
  // ============================================================
  const getStatusBadgeVariant = (status) => {
    const map = {
      'open': 'primary',
      'in-progress': 'warning',
      'resolved': 'success',
      'closed': 'default'
    };
    return map[status] || 'default';
  };

  // ============================================================
  // ✅ PRIORITY BADGE VARIANT
  // ============================================================
  const getPriorityBadgeVariant = (priority) => {
    const map = {
      'low': 'default',
      'medium': 'primary',
      'high': 'warning',
      'urgent': 'danger'
    };
    return map[priority] || 'default';
  };

  // ============================================================
  // ✅ DELETE TICKET
  // ============================================================
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/tickets/${id}`);
      toast.success('Ticket deleted successfully!');
      await fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete ticket');
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // ✅ STATUS CHANGE FUNCTION
  // ============================================================
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setUpdatingId(ticketId);
      
      const payload = { status: newStatus };
      
      // ✅ Resolution required for resolved status
      if (newStatus === 'resolved') {
        const resolution = window.prompt('Please enter resolution details:');
        if (resolution === null) {
          setUpdatingId(null);
          return;
        }
        if (!resolution.trim()) {
          toast.error('Resolution is required');
          setUpdatingId(null);
          return;
        }
        payload.resolution = resolution.trim();
      }

      await api.patch(`/tickets/${ticketId}/status`, payload);
      toast.success(`✅ Ticket status changed to "${newStatus}"!`);
      await fetchTickets();
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // ✅ STATUS OPTIONS
  // ============================================================
  const statusOptions = [
    { value: 'open', label: 'Open', icon: ClockIcon, color: 'blue' },
    { value: 'in-progress', label: 'In Progress', icon: ArrowPathIcon, color: 'yellow' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircleIcon, color: 'green' },
    { value: 'closed', label: 'Closed', icon: XCircleIcon, color: 'gray' }
  ];

  // ============================================================
  // ✅ FILTERED TICKETS
  // ============================================================
  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all support tickets</p>
        </div>
        <Link to="/tickets/create">
          <Button variant="primary">
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* ============================================================
          STATS
          ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.open || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.['in-progress'] || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</p>
        </div>
      </div>

      {/* ============================================================
          FILTERS
          ============================================================ */}
      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <Button variant="primary" onClick={() => fetchTickets()}>
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* ============================================================
          TICKET TABLE
          ============================================================ */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>SLA</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      Loading tickets...
                    </div>
                  </td>
                </tr>
              ) : filteredTickets?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No tickets found. Create your first ticket!
                  </td>
                </tr>
              ) : (
                filteredTickets?.map((ticket) => (
                  <tr key={ticket._id}>
                    {/* Ticket ID */}
                    <td className="font-medium">
                      <Link to={`/tickets/${ticket._id}`} className="text-blue-600 hover:underline">
                        #{ticket.ticketId}
                      </Link>
                    </td>

                    {/* Title */}
                    <td>
                      <div className="truncate max-w-xs">{ticket.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.customer?.name || 'Unknown'}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          ticket.status === 'open' ? 'bg-blue-500' :
                          ticket.status === 'in-progress' ? 'bg-yellow-500' :
                          ticket.status === 'resolved' ? 'bg-green-500' :
                          'bg-gray-500'
                        }`}></span>
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </td>

                    {/* Priority */}
                    <td>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>

                    {/* SLA */}
                    <td>
                      <SLACountdown ticket={ticket} size="sm" />
                    </td>

                    {/* Created */}
                    <td className="text-gray-500 dark:text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>

                    {/* ============================================================
                        ACTIONS
                        ============================================================ */}
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {/* View Button */}
                        <Link
                          to={`/tickets/${ticket._id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>

                        {/* ============================================================
                            ✅ STATUS CHANGE DROPDOWN (Admin/Agent Only)
                            ============================================================ */}
                        {(isAdmin || isAgent) && ticket.status !== 'closed' && (
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                            disabled={updatingId === ticket._id}
                            className={`
                              text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 
                              bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                              ${updatingId === ticket._id ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
                              transition-colors duration-200
                            `}
                            title="Change Status"
                          >
                            <option value="open">🔄 Open</option>
                            <option value="in-progress">⏳ In Progress</option>
                            <option value="resolved">✅ Resolved</option>
                            <option value="closed">❌ Closed</option>
                          </select>
                        )}

                        {/* ============================================================
                            ✅ DELETE BUTTON (Admin Only)
                            ============================================================ */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(ticket._id)}
                            disabled={deletingId === ticket._id}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete Ticket"
                          >
                            {deletingId === ticket._id ? (
                              <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================
            FOOTER - Total Count
            ============================================================ */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredTickets?.length || 0} of {tickets?.length || 0} tickets
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tickets;