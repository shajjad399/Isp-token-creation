// backend/src/middlewares/role.js

export const role = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Access denied. Insufficient permissions');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

export const isAdmin = role(['admin']);
export const isAgent = role(['admin', 'agent']);
export const isCustomer = role(['customer']);

export default {
  role,
  isAdmin,
  isAgent,
  isCustomer
};