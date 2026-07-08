// frontend/src/pages/TicketDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import StatusHistoryTimeline from '../components/tickets/StatusHistoryTimeline';
import SLACountdown from '../components/tickets/SLACountdown';
import {
  ArrowLeftIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [resolution, setResolution] = useState('');

  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // ============================================================
  // ✅ LIVE UPDATES - join this ticket's room and listen for changes
  // so an admin working on the ticket sees updates instantly, and
  // so this viewer's own screen updates without a manual refresh.
  // ============================================================
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join_ticket', id);

    const handleStatusChanged = (payload) => {
      setTicket((prev) => {
        if (!prev || prev.ticketId !== payload.ticketId) return prev;
        toast(`Status changed to "${payload.newStatus}" by ${payload.changedBy}`, { icon: '🔄' });
        return { ...prev, status: payload.newStatus, updatedAt: payload.updatedAt };
      });
      // Refetch to get the fresh statusHistory entry + resolution/closedAt fields
      fetchTicket();
    };

    const handleTicketUpdated = () => {
      fetchTicket();
    };

    const handleNewComment = (payload) => {
      setTicket((prev) => {
        if (!prev) return prev;
        const alreadyExists = prev.comments?.some((c) => c._id === payload.comment._id);
        if (alreadyExists) return prev;
        return { ...prev, comments: [...(prev.comments || []), payload.comment] };
      });
    };

    const handleTicketAssigned = () => {
      fetchTicket();
    };

    socket.on('status_changed', handleStatusChanged);
    socket.on('ticket_updated', handleTicketUpdated);
    socket.on('new_comment', handleNewComment);
    socket.on('ticket_assigned', handleTicketAssigned);

    return () => {
      socket.emit('leave_ticket', id);
      socket.off('status_changed', handleStatusChanged);
      socket.off('ticket_updated', handleTicketUpdated);
      socket.off('new_comment', handleNewComment);
      socket.off('ticket_assigned', handleTicketAssigned);
    };
  }, [socket, id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.data);
    } catch (error) {
      toast.error('Failed to load ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ STATUS CHANGE FUNCTION
  // ============================================================
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      
      const payload = { status: newStatus };
      
      // Resolution required for resolved status
      if (newStatus === 'resolved') {
        if (!resolution.trim()) {
          toast.error('Please provide resolution details');
          setUpdating(false);
          return;
        }
        payload.resolution = resolution;
      }

      const response = await api.patch(`/tickets/${id}/status`, payload);
      
      toast.success(`✅ Ticket status changed to "${newStatus}"!`);
      setTicket(response.data.data);
      setShowStatusModal(false);
      setResolution('');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================
  // OPEN STATUS MODAL
  // ============================================================
  const openStatusModal = (status) => {
    setSelectedStatus(status);
    setResolution('');
    setShowStatusModal(true);
  };

  // ============================================================
  // ADD COMMENT
  // ============================================================
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/tickets/${id}/comments`, { message: comment });
      setTicket({
        ...ticket,
        comments: [...ticket.comments, response.data.data]
      });
      setComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // DELETE TICKET
  // ============================================================
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      setDeleting(true);
      await api.delete(`/tickets/${id}`);
      toast.success('Ticket deleted successfully');
      navigate('/tickets');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete ticket');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // HELPER FUNCTIONS
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

  const getPriorityBadgeVariant = (priority) => {
    const map = {
      'low': 'default',
      'medium': 'primary',
      'high': 'warning',
      'urgent': 'danger'
    };
    return map[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const map = {
      'open': 'bg-blue-500',
      'in-progress': 'bg-yellow-500',
      'resolved': 'bg-green-500',
      'closed': 'bg-gray-500'
    };
    return map[status] || 'bg-gray-500';
  };

  const statusOptions = [
    { value: 'open', label: 'Open', icon: ClockIcon, color: 'blue' },
    { value: 'in-progress', label: 'In Progress', icon: ArrowPathIcon, color: 'yellow' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircleIcon, color: 'green' },
    { value: 'closed', label: 'Closed', icon: XCircleIcon, color: 'gray' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Ticket not found</p>
        <Link to="/tickets" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/tickets" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ticket #{ticket.ticketId}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{ticket.title}</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* ============================================================
          TICKET INFO CARD
          ============================================================ */}
      <Card>
        <CardBody className="space-y-4">
          {/* Status & Priority */}
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`}></span>
                <Badge variant={getStatusBadgeVariant(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
              <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
              <Badge variant="info">{ticket.category}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">SLA</p>
              <div className="mt-1">
                <SLACountdown ticket={ticket} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
            <p className="text-gray-900 dark:text-white mt-1">{ticket.description}</p>
          </div>

          {/* Assigned To */}
          {ticket.assignedTo && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={ticket.assignedTo.name} size="sm" />
                <span className="text-gray-900 dark:text-white">{ticket.assignedTo.name}</span>
              </div>
            </div>
          )}

          {/* ============================================================
              ✅ STATUS CHANGE BUTTONS (Admin/Agent Only)
              ============================================================ */}
          {(isAdmin || isAgent) && ticket.status !== 'closed' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Change Status:</p>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const isActive = ticket.status === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => openStatusModal(status.value)}
                      disabled={isActive || updating}
                      className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:shadow-md'
                        }
                        ${updating ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? '' : 'text-current'}`} />
                      {status.label}
                    </button>
                  );
                })}
              </div>
              {updating && (
                <p className="text-sm text-blue-600 mt-2">Updating status...</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ============================================================
          ✅ STATUS HISTORY TIMELINE
          ============================================================ */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Status History
          </h3>
        </CardHeader>
        <CardBody>
          <StatusHistoryTimeline history={ticket.statusHistory} />
        </CardBody>
      </Card>

      {/* ============================================================
          COMMENTS SECTION
          ============================================================ */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comments ({ticket.comments?.length || 0})
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {ticket.comments?.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No comments yet</p>
          ) : (
            ticket.comments?.map((comment, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <Avatar name={comment.user?.name} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-white">{comment.user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{comment.message}</p>
                </div>
              </div>
            ))
          )}

          {/* Add Comment */}
          <form onSubmit={handleAddComment} className="flex gap-3 mt-4">
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={ticket.status === 'closed'}
            />
            <Button 
              type="submit" 
              variant="primary" 
              loading={submitting}
              disabled={ticket.status === 'closed'}
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
            </Button>
          </form>
          {ticket.status === 'closed' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Comments disabled for closed tickets</p>
          )}
        </CardBody>
      </Card>

      {/* ============================================================
          ✅ STATUS CHANGE MODAL
          ============================================================ */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Change Status to "{selectedStatus}"
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedStatus === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resolution Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows="3"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Please provide details about the resolution
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleStatusChange(selectedStatus)}
                  loading={updating}
                >
                  Confirm Status Change
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;