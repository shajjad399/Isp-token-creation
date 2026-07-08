// backend/src/validators/userValidator.js
import Joi from 'joi';

/**
 * Update profile validation schema
 */
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    }),

  bio: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Bio cannot exceed 500 characters'
    }),
  
  avatar: Joi.string()
    .pattern(/^(https?:\/\/.+|\/uploads\/.+)$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Avatar must be a valid URL or file path'
    })
});

/**
 * Get users query validation schema
 */
export const getUsersQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
  
  role: Joi.string()
    .valid('admin', 'agent', 'customer')
    .optional(),
  
  search: Joi.string()
    .optional(),
  
  isActive: Joi.boolean()
    .optional(),
  
  sortBy: Joi.string()
    .valid('name', 'email', 'role', 'createdAt', 'lastLogin')
    .default('createdAt')
    .optional(),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

/**
 * Update user (Admin) validation schema
 */
export const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .optional(),
  
  email: Joi.string()
    .email()
    .optional(),
  
  role: Joi.string()
    .valid('admin', 'agent', 'customer')
    .optional(),
  
  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .optional(),
  
  isActive: Joi.boolean()
    .optional(),
  
  avatar: Joi.string()
    .pattern(/^(https?:\/\/.+|\/uploads\/.+)$/)
    .allow('', null)
    .optional()
});

/**
 * Bulk user update validation schema
 */
export const bulkUserUpdateSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one user ID is required',
      'array.max': 'Maximum 50 users allowed',
      'any.required': 'User IDs are required'
    }),
  
  isActive: Joi.boolean()
    .required()
    .messages({
      'any.required': 'isActive field is required'
    })
});

/**
 * User ID param validation
 */
export const userIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});

/**
 * Search users query validation
 */
export const searchUsersQuerySchema = Joi.object({
  q: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Search query is required',
      'string.min': 'Search query must be at least 1 character',
      'any.required': 'Search query is required'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
});