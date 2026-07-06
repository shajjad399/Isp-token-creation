// ============================================================
// backend/src/controllers/adminController.js
// ============================================================
// Description: Admin panel controller with all admin operations
// Version: 2.0.0
// ============================================================

import AdminService from '../services/adminService.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../config/logger.js';

// ============================================================
// USER MANAGEMENT CONTROLLERS
// ============================================================

/**
 * @desc    Get all users with pagination and filters
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    logger.info('📡 getAllUsers called');
    const result = await AdminService.getAllUsers(req.query);
    logger.info(`✅ Users fetched: ${result.users?.length || 0}`);
    res.status(200).json(
      ApiResponse.success(result, 'Users fetched successfully')
    );
  } catch (error) {
    logger.error('❌ getAllUsers error:', error);
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req, res, next) => {
  try {
    logger.info(`📡 getUserById called, ID: ${req.params.id}`);
    const user = await AdminService.getUserById(req.params.id);
    logger.info(`✅ User found: ${user?.email}`);
    res.status(200).json(
      ApiResponse.success(user, 'User fetched successfully')
    );
  } catch (error) {
    logger.error('❌ getUserById error:', error);
    next(error);
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
export const createUser = async (req, res, next) => {
  try {
    logger.info('📡 createUser called');
    logger.info('📝 Data:', req.body);
    const user = await AdminService.createUser(req.body);
    logger.info(`✅ User created: ${user?.email}`);
    res.status(201).json(
      ApiResponse.success(user, 'User created successfully')
    );
  } catch (error) {
    logger.error('❌ createUser error:', error);
    next(error);
  }
};

/**
 * @desc    Update user information
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req, res, next) => {
  try {
    logger.info(`📡 updateUser called, ID: ${req.params.id}`);
    logger.info('📝 Data:', req.body);
    const user = await AdminService.updateUser(
      req.params.id,
      req.body,
      req.user.id
    );
    logger.info(`✅ User updated: ${user?.email}`);
    res.status(200).json(
      ApiResponse.success(user, 'User updated successfully')
    );
  } catch (error) {
    logger.error('❌ updateUser error:', error);
    next(error);
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    logger.info(`📡 deleteUser called, ID: ${req.params.id}`);
    const result = await AdminService.deleteUser(req.params.id, req.user.id);
    logger.info(`✅ User deleted: ${result?.email}`);
    res.status(200).json(
      ApiResponse.success(result, 'User deleted successfully')
    );
  } catch (error) {
    logger.error('❌ deleteUser error:', error);
    next(error);
  }
};

/**
 * @desc    Bulk update users (activate/deactivate, change role)
 * @route   PATCH /api/admin/users/bulk
 * @access  Private/Admin
 */
export const bulkUpdateUsers = async (req, res, next) => {
  try {
    logger.info('📡 bulkUpdateUsers called');
    const { userIds, ...updateData } = req.body;
    const result = await AdminService.bulkUpdateUsers(userIds, updateData);
    logger.info(`✅ Bulk updated: ${result.modifiedCount} users`);
    res.status(200).json(
      ApiResponse.success(result, 'Users updated successfully')
    );
  } catch (error) {
    logger.error('❌ bulkUpdateUsers error:', error);
    next(error);
  }
};

// ============================================================
// STATS AND DASHBOARD CONTROLLERS
// ============================================================

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    logger.info('📡 getDashboardStats called');
    const stats = await AdminService.getDashboardStats();
    logger.info('✅ Stats fetched:', stats);
    res.status(200).json(
      ApiResponse.success(stats, 'Dashboard stats fetched successfully')
    );
  } catch (error) {
    logger.error('❌ getDashboardStats error:', error);
    // Return empty stats instead of error
    res.status(200).json(
      ApiResponse.success(
        {
          totalUsers: 0,
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          closedTickets: 0,
          byRole: {},
          byPriority: {}
        },
        'Dashboard stats fetched (default)'
      )
    );
  }
};

/**
 * @desc    Get user activity log
 * @route   GET /api/admin/users/:id/activity
 * @access  Private/Admin
 */
export const getUserActivity = async (req, res, next) => {
  try {
    logger.info(`📡 getUserActivity called, ID: ${req.params.id}`);
    const activity = await AdminService.getUserActivity(req.params.id);
    logger.info('✅ Activity fetched');
    res.status(200).json(
      ApiResponse.success(activity, 'User activity fetched successfully')
    );
  } catch (error) {
    logger.error('❌ getUserActivity error:', error);
    next(error);
  }
};