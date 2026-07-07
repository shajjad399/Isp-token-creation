// ============================================================
// frontend/src/components/tickets/StatusHistoryTimeline.jsx
// ============================================================
// Description: Shows the full history of status changes for a
// ticket (old -> new, who changed it, when) so nothing gets lost
// when the current status is overwritten.
// ============================================================

import React from 'react';
import {
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const STATUS_META = {
  open: { label: 'Open', icon: ClockIcon, dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  'in-progress': { label: 'In Progress', icon: ArrowPathIcon, dot: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
  resolved: { label: 'Resolved', icon: CheckCircleIcon, dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  closed: { label: 'Closed', icon: XCircleIcon, dot: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400' }
};

const StatusHistoryTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No status history yet
      </p>
    );
  }

  // Newest first
  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
  );

  return (
    <div className="space-y-0">
      {sorted.map((entry, index) => {
        const meta = STATUS_META[entry.newStatus] || STATUS_META.open;
        const Icon = meta.icon;
        const isLast = index === sorted.length - 1;

        return (
          <div key={entry._id || index} className="relative flex gap-3 pb-6">
            {/* Vertical connecting line */}
            {!isLast && (
              <span className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
            )}

            {/* Dot / icon */}
            <span className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${meta.dot} bg-opacity-15`}>
              <Icon className={`h-4 w-4 ${meta.text}`} />
            </span>

            <div className="flex-1 pt-0.5">
              <p className="text-sm text-gray-900 dark:text-white">
                {entry.oldStatus ? (
                  <>
                    Status changed from{' '}
                    <span className="font-medium">{STATUS_META[entry.oldStatus]?.label || entry.oldStatus}</span>
                    {' '}to{' '}
                    <span className={`font-medium ${meta.text}`}>{meta.label}</span>
                  </>
                ) : (
                  <span className={`font-medium ${meta.text}`}>Ticket created ({meta.label})</span>
                )}
              </p>
              {entry.note && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{entry.note}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {entry.changedByName || 'System'} · {new Date(entry.changedAt).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusHistoryTimeline;