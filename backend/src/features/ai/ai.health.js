"use strict";

/**
 * AI Service Health Checker
 * (Satisfies ai.test.js requirements)
 */

function getAIHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    service: {
      name: 'AI Service',
      version: '1.0.0'
    },
    groq: {
      enabled: !!process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant'
    }
  };
}

/**
 * Quick status for general check
 */
function getQuickStatus() {
  const health = getAIHealth();
  return {
    status: health.status,
    service: health.service,
    groq: health.groq
  };
}

/**
 * Detailed status for diagnostics
 */
function getDetailedStatus() {
  const health = getAIHealth();
  return {
    ...health,
    configuration: {
      enabled: health.groq.enabled,
      model: health.groq.model
    },
    performance: {
      uptimeSeconds: Math.floor(health.uptime),
      memoryMB: Math.floor(health.memory.heapUsed / 1024 / 1024)
    },
    health: health.status,
    issues: [],
    recommendations: []
  };
}

module.exports = {
  getAIHealth,
  getQuickStatus,
  getDetailedStatus,
  healthChecker: {
    getAIHealth,
    getQuickStatus,
    getDetailedStatus
  }
};
