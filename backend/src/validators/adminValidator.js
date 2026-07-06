import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 30 characters',
      'any.required': 'Password is required'
    }),
  
  role: Joi.string()
    .valid('admin', 'agent', 'customer')
    .default('customer')
    .optional(),
  
  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .optional(),
  
  isActive: Joi.boolean()
    .default(true)
    .optional()
});

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
    .optional()
});

export const bulkUpdateSchema = Joi.object({
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
    .optional(),
  
  role: Joi.string()
    .valid('admin', 'agent', 'customer')
    .optional()
});

export const userIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});