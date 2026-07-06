// backend/src/constants/roles.js
export const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  CUSTOMER: 'customer'
};

export const ROLE_PRIORITY = {
  [ROLES.ADMIN]: 3,
  [ROLES.AGENT]: 2,
  [ROLES.CUSTOMER]: 1
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_tickets',
    'manage_settings',
    'view_reports',
    'assign_tickets'
  ],
  [ROLES.AGENT]: [
    'view_tickets',
    'update_tickets',
    'assign_tickets',
    'add_comments'
  ],
  [ROLES.CUSTOMER]: [
    'create_tickets',
    'view_own_tickets',
    'add_comments',
    'view_profile'
  ]
};