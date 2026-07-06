// backend/src/constants/ticketStatus.js
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const TICKET_STATUS_LABELS = {
  [TICKET_STATUS.OPEN]: 'Open',
  [TICKET_STATUS.IN_PROGRESS]: 'In Progress',
  [TICKET_STATUS.RESOLVED]: 'Resolved',
  [TICKET_STATUS.CLOSED]: 'Closed'
};

export const TICKET_STATUS_COLORS = {
  [TICKET_STATUS.OPEN]: 'blue',
  [TICKET_STATUS.IN_PROGRESS]: 'yellow',
  [TICKET_STATUS.RESOLVED]: 'green',
  [TICKET_STATUS.CLOSED]: 'gray'
};

export const TICKET_STATUS_SEQUENCE = [
  TICKET_STATUS.OPEN,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.RESOLVED,
  TICKET_STATUS.CLOSED
];