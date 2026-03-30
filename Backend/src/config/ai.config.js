// ─── Commit: AI Configuration - Neural Tuning ───
// What this does: Centralizes all AI model settings, rate limits, and cost guardrails.
// Why it exists: To avoid hardcoding values in services and to allow quick adjustments to AI behavior.
// How it works: Exports a JSON-like object with settings for Groq, Google Vision, and the internal recommendation engine.
// Beginner note: Config files are the "Settings" menu of your backend.

"use strict";

require("dotenv").config();

module.exports = {
  // ─── Commit: LLM Model Settings ───
  // why llama-3.1-8b? It provides a perfect balance of speed and intelligence for real-time chat.
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-8b-instant",
    maxTokens: 4096,
    temperature: 0.7,
    enabled: !!process.env.GROQ_API_KEY,
  },

  googleVision: {
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    enabled: !!process.env.GOOGLE_CLOUD_KEY_FILE,
  },

  // ─── Commit: Moderation & Recommendation logic ───
  // Interview insight: Thresholding (0.8) prevents "False Positives" in automated moderation.
  models: {
    moderation: {
      enabled: true,
      threshold: 0.8, 
    },

    recommendation: {
      enabled: true,
      historyWeight: 0.6,
      genreWeight: 0.2,
      moodWeight: 0.2,
    },
  },

  features: {
    aiRecommendations: true,
    contentModeration: true,
    captionGeneration: true,
    hashtagSuggestion: true,
    moodPlaylists: true,
    trendingInsights: true,
  },

  // ─── Commit: caching Strategy ───
  // ttl (Time To Live): How long (in seconds) we should remember an AI response before asking again.
  cache: {
    ttl: {
      recommendations: 3600, 
      trends: 1800, 
      moderation: 86400, 
    },
    maxSize: 1000,
  },

  // ─── Commit: Security - Rate Limits ───
  // what this does: Prevents a single user from spamming the AI and draining our API credits.
  rateLimits: {
    aiGen: {
      windowMs: 60000,
      max: 10,
    },
  },

  // ─── Commit: cost Infrastructure ───
  // why it exists: AI is expensive. budget control is mandatory for production apps.
  costLimits: {
    dailyBudget: 5.0, 
    warningThreshold: 0.8, 
  },
};

