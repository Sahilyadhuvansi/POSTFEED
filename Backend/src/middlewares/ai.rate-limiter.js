/**
 * AI Rate Limiting Middleware
 * Fast, stateless protection against API abuse
 */

const rateLimit = require('express-rate-limit');

/**
 * Configure standard rate limits
 */
const RATE_LIMITS = {
  authenticated: {
    windowMs: 60 * 1000,      // 1 minute
    max: 20,                   // 20 requests per minute
    message: 'Too many requests, please slow down'
  },
  anonymous: {
    windowMs: 60 * 1000,       // 1 minute
    max: 5,                    // 5 requests per minute
    message: 'Rate limit exceeded, please wait'
  }
};

/**
 * Generic rate limiter middleware creator
 */
const createRateLimiter = (config = RATE_LIMITS.authenticated) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: config.windowMs
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      // Skip health checks
      return req.path.includes('/health');
    }
  });
};

module.exports = {
  RATE_LIMITS,
  createRateLimiter,
  aiRateLimiter: createRateLimiter()
};
