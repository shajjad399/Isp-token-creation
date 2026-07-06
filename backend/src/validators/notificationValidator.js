// backend/src/validators/notificationValidator.js
import Joi from 'joi';

/**
 * Get notifications query validation schema
 */
export const getNotificationsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional(),
  
  isRead: Joi.boolean()
    .optional(),
  
  type: Joi.string()
    .valid('ticket_created', 'ticket_assigned', 'ticket_resolved', 'ticket_closed', 'comment_added')
    .optional(),
  
  sortBy: Joi.string()
    .valid('createdAt', 'isRead')
    .default('createdAt')
    .optional(),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

/**
 * Notification ID param validation
 */
export const notificationIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid notification ID format',
      'any.required': 'Notification ID is required'
    })
});

/**
 * Mark notifications as read schema
 */
export const markNotificationsReadSchema = Joi.object({
  notificationIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(50)
    .optional(),
  
  all: Joi.boolean()
    .default(false)
    .optional()
});