// backend/src/middlewares/errorHandler.js
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error
  logger.error(`Error: ${error.message}`, {
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    error = new ApiError(409, `${field} already exists`);
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    error = new ApiError(400, errors.join(', '));
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    error = new ApiError(400, `Invalid ${error.path}: ${error.value}`);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong';
  const isOperational = error.isOperational || false;

  const response = {
    success: false,
    status: statusCode,
    message,
    timestamp: new Date().toISOString()
  };

  if (!isOperational && env.isDevelopment) {
    response.stack = error.stack;
  }

  if (env.isDevelopment) {
    response.details = error.details || null;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;