"use strict";

/**
 * Global Error Handler Middleware
 * Normalizes all error types into a consistent JSON response
 * Format: { success: false, error: { message, code, details, requestId } }
 */

const ErrorResponse = require('../utils/ErrorResponse');

const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for development
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    // Non-blocking log for high traffic
    process.stdout.write(`❌ [${req.id || 'N/A'}] ${err.stack}\n`);
  } else {
    // Production: Simplified log with requestId
    process.stdout.write(`❌ [${req.id || 'N/A'}] ${err.statusCode || 500} - ${err.message}\n`);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404, 'RESOURCE_NOT_FOUND');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400, 'DUPLICATE_ENTRY');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errorEntries = err.errors ? Object.values(err.errors) : [];
    const message = errorEntries.map((val) => val.message || 'Validation error');
    error = new ErrorResponse(message.join('. ') || err.message, 400, 'VALIDATION_ERROR', err.errors);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Not authorized, token failed', 401, 'AUTH_ERROR');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Not authorized, token expired', 401, 'AUTH_EXPIRED');
  }

  // Standardize Response
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_ERROR';
  const errorMessage = error.message || 'Server Error';

  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
      code: errorCode,
      details: error.details || null,
      requestId: req.id || null,
      ...(isProd ? {} : { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
