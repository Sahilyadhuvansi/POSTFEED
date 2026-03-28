/**
 * Custom Error Class for API responses
 * This allows us to throw errors with specific status codes and messages
 * which the global error handler will then format consistently.
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capture stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
