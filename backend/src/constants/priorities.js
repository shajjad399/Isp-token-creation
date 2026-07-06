// backend/src/constants/priorities.js
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const PRIORITY_LABELS = {
  [PRIORITIES.LOW]: 'Low',
  [PRIORITIES.MEDIUM]: 'Medium',
  [PRIORITIES.HIGH]: 'High',
  [PRIORITIES.URGENT]: 'Urgent'
};

export const PRIORITY_COLORS = {
  [PRIORITIES.LOW]: 'gray',
  [PRIORITIES.MEDIUM]: 'blue',
  [PRIORITIES.HIGH]: 'orange',
  [PRIORITIES.URGENT]: 'red'
};

export const PRIORITY_WEIGHTS = {
  [PRIORITIES.LOW]: 1,
  [PRIORITIES.MEDIUM]: 2,
  [PRIORITIES.HIGH]: 3,
  [PRIORITIES.URGENT]: 4
};