"use strict";

/**
 * Custom Error Class for API responses
 * This allows us to throw errors with specific status codes, messages, and structured details
 * which the global error handler will then format consistently.
 */
class ErrorResponse extends Error {
  constructor(message, statusCode, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Capture stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
