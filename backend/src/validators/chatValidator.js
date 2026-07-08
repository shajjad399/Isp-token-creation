// backend/src/validators/chatValidator.js
import Joi from 'joi';

/**
 * Start (or resume) a chat session
 */
export const startChatSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .max(150)
    .optional()
    .messages({
      'string.max': 'Subject cannot exceed 150 characters'
    })
});

/**
 * Send a chat message
 */
export const sendMessageSchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    }),

  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().required(),
        url: Joi.string().required(),
        size: Joi.number().optional(),
        mimeType: Joi.string().optional()
      })
    )
    .optional()
});

/**
 * Close a chat with an optional rating
 */
export const closeChatSchema = Joi.object({
  rating: Joi.object({
    score: Joi.number().min(1).max(5).optional(),
    feedback: Joi.string().trim().max(500).optional()
  }).optional()
});
