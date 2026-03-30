"use strict";

/**
 * AI Error Recovery & Fallback Strategies
 * Implements intelligent, context-aware recovery for AI failures
 */

const aiService = require('./ai.service');

const ErrorCategory = {
  TRANSIENT: 'transient',        // Timeout, rate limits
  PERMANENT: 'permanent',        // Validation, auth
  DEGRADED: 'degraded',          // SLOW responses
  CRITICAL: 'critical'           // Service down
};

const RecoveryStrategy = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  CACHE: 'cache',
  DEGRADE: 'degrade'
};

const FALLBACKS = {
  captionGeneration: {
    happy: 'Check out my new music! 🎵',
    sad: 'A new mood for you to explore 🎼',
    energetic: 'Turn it up! 🎸',
    chill: 'Relax with this one 😌',
    romantic: 'Love is in the air 💕'
  },
  suggestionHashtags: {
    default: ['musicproducer', 'newmusic', 'artistlife', 'musicproduction']
  },
  chat: {
    greeting: 'Hello! I am here to help you with your music.'
  }
};

class ErrorRecoveryManager {
  constructor() {
    this.stats = { totalErrors: 0, recovered: 0, fallbacks: 0 };
  }

  /**
   * Classify and execute recovery
   */
  async classifyAndRecover(error, context = {}) {
    this.stats.totalErrors++;
    const classification = this._classifyError(error);
    const strategy = this._selectStrategy(classification, context);
    
    const recovery = this._executeRecovery(classification, strategy, context);
    if (recovery.success) {
      this.stats.recovered++;
    }
    return recovery;
  }

  _classifyError(error) {
    const msg = error.message || '';
    if (msg.includes('timeout') || msg.includes('429')) return { category: ErrorCategory.TRANSIENT, retryable: true };
    if (msg.includes('invalid') || msg.includes('400')) return { category: ErrorCategory.PERMANENT, retryable: false };
    if (msg.includes('503') || msg.includes('service unavailable')) return { category: ErrorCategory.CRITICAL, retryable: false };
    return { category: ErrorCategory.DEGRADED, retryable: true };
  }

  _selectStrategy(classification, context) {
    if (classification.category === ErrorCategory.TRANSIENT && !context.isRetry) return RecoveryStrategy.RETRY;
    return RecoveryStrategy.FALLBACK;
  }

  _executeRecovery(classification, strategy, context) {
    const { endpointType, mood = 'happy' } = context;

    if (strategy === RecoveryStrategy.FALLBACK) {
      this.stats.fallbacks++;
      const data = this._generateSemanticFallback(endpointType, mood);
      return { success: true, action: 'fallback', data };
    }

    return { success: false, action: 'none' };
  }

  _generateSemanticFallback(type, mood) {
    if (type === 'captionGeneration') {
      return { caption: FALLBACKS.captionGeneration[mood] || FALLBACKS.captionGeneration.happy };
    }
    if (type === 'hashtagSuggestion') {
      return { hashtags: FALLBACKS.suggestionHashtags.default };
    }
    return { message: FALLBACKS.chat.greeting };
  }
}

const recoveryManager = new ErrorRecoveryManager();

module.exports = {
  recoveryManager,
  RecoveryStrategy,
  ErrorCategory,
  FALLBACKS
};
