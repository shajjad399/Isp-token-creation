// ============================================================
// backend/src/routes/userRoutes.js
// ============================================================
// Description: User routes with profile management, 
//              photo upload, activity log, and account management
// Version: 2.0.0
// ============================================================

import express from 'express';
import { 
  getProfile,
  updateProfile,
  getUserTickets,
  getAgentPerformance,
  uploadProfilePhoto,
  deleteAccount,
  getActivityLog,
  getUserStats
} from '../controllers/userController.js';
import { auth } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import { updateProfileSchema } from '../validators/authValidator.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// All user routes require authentication
router.use(auth);

// ============================================================
// ✅ PROFILE ROUTES
// ============================================================

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile with stats
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validate(updateProfileSchema), updateProfile);

/**
 * @route   POST /api/users/profile/photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/profile/photo', upload.single('avatar'), uploadProfilePhoto);

// ============================================================
// ✅ ACCOUNT MANAGEMENT
// ============================================================

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', deleteAccount);

// ============================================================
// ✅ ACTIVITY & STATS
// ============================================================

/**
 * @route   GET /api/users/activity
 * @desc    Get user activity log
 * @access  Private
 */
router.get('/activity', getActivityLog);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', getUserStats);

// ============================================================
// ✅ TICKET ROUTES
// ============================================================

/**
 * @route   GET /api/users/tickets
 * @desc    Get user's own tickets
 * @access  Private
 */
router.get('/tickets', getUserTickets);

// ============================================================
// ✅ ADMIN ROUTES
// ============================================================

/**
 * @route   GET /api/users/agents/performance
 * @desc    Get agent performance (Admin only)
 * @access  Private/Admin
 */
router.get('/agents/performance', role(['admin']), getAgentPerformance);

export default router;