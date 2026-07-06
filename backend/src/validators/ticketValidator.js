// backend/src/validators/ticketValidator.js
import Joi from 'joi';

/**
 * Create ticket validation schema
 */
export const createTicketSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 5000 characters',
      'any.required': 'Description is required'
    }),
  
  category: Joi.string()
    .valid('internet', 'iptv', 'billing', 'technical', 'other')
    .required()
    .messages({
      'any.only': 'Category must be one of: internet, iptv, billing, technical, other',
      'any.required': 'Category is required'
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  
  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().required(),
        url: Joi.string().uri().required(),
        size: Joi.number().max(5242880).optional(),
        mimeType: Joi.string().optional()
      })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 attachments allowed'
    })
});

/**
 * Update ticket validation schema
 */
export const updateTicketSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .min(10)
    .max(5000)
    .optional()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 5000 characters'
    }),
  
  category: Joi.string()
    .valid('internet', 'iptv', 'billing', 'technical', 'other')
    .optional()
    .messages({
      'any.only': 'Category must be one of: internet, iptv, billing, technical, other'
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    })
});

/**
 * Assign ticket validation schema
 */
export const assignTicketSchema = Joi.object({
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid agent ID format',
      'string.empty': 'Agent ID is required',
      'any.required': 'Agent ID is required'
    })
});

/**
 * Change status validation schema
 */
export const changeStatusSchema = Joi.object({
  status: Joi.string()
    .valid('open', 'in-progress', 'resolved', 'closed')
    .required()
    .messages({
      'any.only': 'Status must be one of: open, in-progress, resolved, closed',
      'any.required': 'Status is required'
    }),
  
  resolution: Joi.string()
    .min(10)
    .max(1000)
    .when('status', {
      is: 'resolved',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
    .messages({
      'string.min': 'Resolution must be at least 10 characters',
      'string.max': 'Resolution cannot exceed 1000 characters',
      'any.required': 'Resolution is required when resolving ticket'
    })
});

/**
 * Add comment validation schema
 */
export const addCommentSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Comment message is required',
      'string.min': 'Comment must be at least 1 character',
      'string.max': 'Comment cannot exceed 2000 characters',
      'any.required': 'Comment message is required'
    }),
  
  isInternal: Joi.boolean()
    .default(false)
    .optional()
});

/**
 * Get tickets query validation schema
 */
export const getTicketsQuerySchema = Joi.object({
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
  
  status: Joi.string()
    .valid('open', 'in-progress', 'resolved', 'closed')
    .optional(),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional(),
  
  category: Joi.string()
    .valid('internet', 'iptv', 'billing', 'technical', 'other')
    .optional(),
  
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  
  search: Joi.string()
    .optional(),
  
  dateFrom: Joi.date()
    .optional(),
  
  dateTo: Joi.date()
    .optional(),
  
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'priority', 'status')
    .default('createdAt')
    .optional(),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

/**
 * Ticket ID param validation
 */
export const ticketIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ticket ID format',
      'any.required': 'Ticket ID is required'
    })
});

/**
 * Bulk status update validation
 */
export const bulkStatusUpdateSchema = Joi.object({
  ticketIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one ticket ID is required',
      'array.max': 'Maximum 100 tickets allowed',
      'any.required': 'Ticket IDs are required'
    }),
  
  status: Joi.string()
    .valid('open', 'in-progress', 'resolved', 'closed')
    .required()
    .messages({
      'any.only': 'Status must be one of: open, in-progress, resolved, closed',
      'any.required': 'Status is required'
    })
});

/**
 * Ticket filter schema for export
 */
export const exportTicketSchema = Joi.object({
  format: Joi.string()
    .valid('csv', 'pdf', 'excel')
    .default('csv')
    .optional(),
  
  status: Joi.string()
    .valid('open', 'in-progress', 'resolved', 'closed')
    .optional(),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional(),
  
  category: Joi.string()
    .valid('internet', 'iptv', 'billing', 'technical', 'other')
    .optional(),
  
  dateFrom: Joi.date()
    .optional(),
  
  dateTo: Joi.date()
    .optional()
});