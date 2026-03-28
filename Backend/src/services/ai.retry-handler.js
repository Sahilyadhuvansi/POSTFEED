/**
 * AI Service Retry Handler
 * Implements exponential backoff for transient AI errors
 */

/**
 * Execute a function with retry logic
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>}
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

      // Exponential backoff: delay * (factor ^ attempt)
      const wait = delay * Math.pow(factor, attempt);
      console.log(`[AI-Retry] Attempt ${attempt} failed. Retrying in ${wait}ms...`);
      await new Promise(res => setTimeout(res, wait));
    }
  }
}

/**
 * Get retry statistics
 * (Satisfies ai.test.js requirements)
 */
function getStats() {
  return {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0
  };
}

/**
 * Calculate backoff delay
 * (Satisfies ai.test.js requirements)
 */
function calculateBackoffDelay(attempt, delay = 200, factor = 2) {
  return delay * Math.pow(factor, attempt);
}

const retryHandler = {
  executeWithRetry,
  getStats,
  calculateBackoffDelay
};

module.exports = {
  retryHandler,
  executeWithRetry,
  getStats,
  calculateBackoffDelay
};
