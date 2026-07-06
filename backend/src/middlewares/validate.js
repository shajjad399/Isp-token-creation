// backend/src/middlewares/validate.js

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Request source (body, query, params)
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      let dataToValidate;
      
      // Get data from request source
      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      // If no schema provided, skip validation
      if (!schema) {
        return next();
      }

      // Validate data
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        errors: {
          wrap: {
            label: false
          }
        }
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        console.warn('Validation failed:', {
          source,
          errors,
          data: dataToValidate
        });

        const validationError = new Error('Validation failed');
        validationError.statusCode = 400;
        validationError.details = errors;
        return next(validationError);
      }

      // Replace request data with validated data
      req[source] = value;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Combined validation for multiple sources
 * @param {Object} schemas - Object with source as key and schema as value
 * @returns {Function} Express middleware
 */
export const validateCombined = (schemas) => {
  return (req, res, next) => {
    try {
      const errors = [];
      const validatedData = {};

      // Validate each source
      for (const [source, schema] of Object.entries(schemas)) {
        let dataToValidate;
        
        switch (source) {
          case 'body':
            dataToValidate = req.body;
            break;
          case 'query':
            dataToValidate = req.query;
            break;
          case 'params':
            dataToValidate = req.params;
            break;
          default:
            dataToValidate = req.body;
        }

        // If no schema, skip
        if (!schema) {
          validatedData[source] = dataToValidate;
          continue;
        }

        const { error, value } = schema.validate(dataToValidate, {
          abortEarly: false,
          stripUnknown: true,
          errors: {
            wrap: {
              label: false
            }
          }
        });

        if (error) {
          const fieldErrors = error.details.map(detail => ({
            source,
            field: detail.path.join('.'),
            message: detail.message
          }));
          errors.push(...fieldErrors);
        }

        validatedData[source] = value;
      }

      if (errors.length > 0) {
        console.warn('Combined validation failed:', { errors });
        const validationError = new Error('Validation failed');
        validationError.statusCode = 400;
        validationError.details = errors;
        return next(validationError);
      }

      // Replace request data with validated data
      for (const [source, value] of Object.entries(validatedData)) {
        req[source] = value;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Sanitize request data middleware
 * Removes potentially dangerous characters
 */
export const sanitize = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    // Remove script tags and dangerous characters
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

export default {
  validate,
  validateCombined,
  sanitize
};