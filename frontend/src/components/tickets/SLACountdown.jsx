// ============================================================
// frontend/src/components/tickets/SLACountdown.jsx
// ============================================================
// Description: Live SLA countdown / overdue badge for a ticket.
// Updates every minute. Hidden for resolved/closed tickets unless
// they breached SLA (then shows a static "Breached" badge).
// ============================================================

import React, { useState, useEffect } from 'react';
import { ClockIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';

const formatRemaining = (ms) => {
  const abs = Math.abs(ms);
  const totalMinutes = Math.floor(abs / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const SLACountdown = ({ ticket, size = 'md', showIcon = true }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const resolutionDueAt = ticket?.sla?.resolutionDueAt;
  const isFinished = ['resolved', 'closed'].includes(ticket?.status);

  if (!resolutionDueAt) {
    return null;
  }

  // Ticket already finished
  if (isFinished) {
    if (ticket.sla?.breached) {
      return (
        <Badge variant="danger" size={size}>
          {showIcon && <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />}
          SLA Breached
        </Badge>
      );
    }
    return (
      <Badge variant="success" size={size}>
        {showIcon && <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />}
        Within SLA
      </Badge>
    );
  }

  const dueTime = new Date(resolutionDueAt).getTime();
  const diff = dueTime - now;
  const isOverdue = diff <= 0;

  // Warn when less than 25% of typical window remains (~2 hours as a simple heuristic)
  const isWarning = !isOverdue && diff < 2 * 60 * 60 * 1000;

  const variant = isOverdue ? 'danger' : isWarning ? 'warning' : 'default';
  const label = isOverdue
    ? `Overdue by ${formatRemaining(diff)}`
    : `${formatRemaining(diff)} left`;

  return (
    <Badge variant={variant} size={size} title={new Date(resolutionDueAt).toLocaleString()}>
      {showIcon && (isOverdue ? (
        <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
      ) : (
        <ClockIcon className="h-3.5 w-3.5 mr-1" />
      ))}
      {label}
    </Badge>
  );
};

export default SLACountdown;