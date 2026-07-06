// backend/src/validators/index.js
export * from './authValidator.js';
export * from './ticketValidator.js';
export * from './userValidator.js';
export * from './notificationValidator.js';

/**
 * Common validation schemas
 */
export const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});

export const paginationSchema = Joi.object({
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
    .optional()
});

export const dateRangeSchema = Joi.object({
  dateFrom: Joi.date()
    .optional(),
  
  dateTo: Joi.date()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.min': 'dateTo must be after dateFrom'
    })
});

export const searchSchema = Joi.object({
  q: Joi.string()
    .min(1)
    .optional()
});