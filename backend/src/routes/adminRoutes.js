// ============================================================
// backend/src/routes/adminRoutes.js
// ============================================================
// Description: Admin panel routes with full CRUD operations
// Version: 2.0.0
// ============================================================

import express from 'express';
import { 
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  getDashboardStats,
  getUserActivity
} from '../controllers/adminController.js';
import { auth } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import { 
  createUserSchema, 
  updateUserSchema, 
  bulkUpdateSchema,
  userIdParamSchema
} from '../validators/adminValidator.js';

const router = express.Router();

// ============================================================
// ✅ ADMIN MIDDLEWARE - সব Route এ লাগবে
// ============================================================
router.use(auth);
router.use(role(['admin']));

// ============================================================
// ✅ DASHBOARD & STATS
// ============================================================

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private/Admin
 */
router.get('/stats', getDashboardStats);

// ============================================================
// ✅ USER MANAGEMENT - FULL CRUD
// ============================================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private/Admin
 * @query   page, limit, role, search, isActive
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/users/:id', validate(userIdParamSchema, 'params'), getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user
 * @access  Private/Admin
 * @body    name, email, password, role, phone, isActive
 */
router.post('/users', validate(createUserSchema), createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user information
 * @access  Private/Admin
 * @body    name, email, role, phone, isActive
 */
router.put('/users/:id', validate(userIdParamSchema, 'params'), validate(updateUserSchema), updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user
 * @access  Private/Admin
 */
router.delete('/users/:id', validate(userIdParamSchema, 'params'), deleteUser);

/**
 * @route   PATCH /api/admin/users/bulk
 * @desc    Bulk update users (activate/deactivate, change role)
 * @access  Private/Admin
 * @body    userIds, isActive, role
 */
router.patch('/users/bulk', validate(bulkUpdateSchema), bulkUpdateUsers);

// ============================================================
// ✅ USER ACTIVITY
// ============================================================

/**
 * @route   GET /api/admin/users/:id/activity
 * @desc    Get user activity log
 * @access  Private/Admin
 */
router.get('/users/:id/activity', validate(userIdParamSchema, 'params'), getUserActivity);

// ============================================================
// ✅ EXPORT ROUTER
// ============================================================

export default router;