"use strict";

/**
 * AI Service Retry Handler
 * Implements exponential backoff for transient AI errors
 */

/**
 * Execute a function with retry logic
 */
async function executeWithRetry(fn, options = {}) {
  const {
    retries = 3,
    delay = 200,
    factor = 2
  } = options;

  let attempt = 0;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;

      const wait = delay * Math.pow(factor, attempt);
      await new Promise(res => setTimeout(res, wait));
    }
  }
}

function getStats() {
  return {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0
  };
}

function calculateBackoffDelay(attempt, delay = 200, factor = 2) {
  return delay * Math.pow(factor, attempt);
}

module.exports = {
  executeWithRetry,
  getStats,
  calculateBackoffDelay
};
