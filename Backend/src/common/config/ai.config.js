// ─── Commit: Environment Configuration Loader ───
// What this does: Loads environment variables (.env) into memory.
require("dotenv").config();

/**
 * AI Services Configuration for POSTFEED
 * Centralized configuration for all AI/ML services used in the application
 */
// ─── Commit: Centralized AI Config Object ───
// Why it exists: To avoid "Hardcoding" secrets like API keys in your logic files. 
// Interview insight: This follows the "12-Factor App" methodology for configuration management.
module.exports = {
  // ─── Commit: LLM Service Settings (Groq, OpenAI) ───
  // What this does: Defines which AI models to use and their "strictness" (Temperature). 
  // Beginner note: '!!' is an elegant way to convert a string to a Boolean (True/False).
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    maxTokens: 4096,
    temperature: 0.7,
    enabled: !!process.env.GROQ_API_KEY,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o",
    maxTokens: 4096,
    temperature: 0.7,
    enabled: !!process.env.OPENAI_API_KEY,
  },

  // ─── Commit: Computer Vision (Google Vision) ───
  // What this does: Configures the "Eyes" of the system for content moderation.
  googleVision: {
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    enabled: !!process.env.GOOGLE_CLOUD_KEY_FILE,
  },

  // ─── Commit: Model Thresholds & Parameters ───
  // What this does: Fine-tunes the "Intelligence" logic for specific features.
  models: {
    // How strictly should we flag inappropriate content? (0.8 = 80% confidence required)
    moderation: {
      enabled: true,
      threshold: 0.8, 
    },

    // Music Recommendation weights
    recommendation: {
      enabled: true,
      historyWeight: 0.6,
      genreWeight: 0.2,
      moodWeight: 0.2,
    },
  },

  // ─── Commit: Application Feature Flags ───
  // What this does: Allows us to turn features ON/OFF without deleting code.
  // Interview insight: This allows for "Dark Launches" — where code is live but hidden from users.
  features: {
    aiRecommendations: true,
    contentModeration: true,
    captionGeneration: true,
    hashtagSuggestion: true,
    moodPlaylists: true,
    trendingInsights: true,
  },

  // ─── Commit: Caching Engine (In-Memory) ───
  // Why it exists: AI is slow and expensive. Caching stores the answer so we don't ask the same thing twice.
  // Beginner note: TTL means "Time To Live" in seconds. 3600 = 1 Hour.
  cache: {
    ttl: {
      recommendations: 3600, 
      trends: 1800, 
      moderation: 86400, 
    },
    maxSize: 1000,
  },

  // ─── Commit: Rate Limiting & Safety ───
  // What this does: Prevents users (or bots) from spamming the AI and costing you money.
  rateLimits: {
    aiGen: {
      windowMs: 60000, // 1 minute
      max: 10, // max 10 requests per minute
    },
  },

  // ─── Commit: Economic Safety (Budgeting) ───
  // Why it exists: To stop the server if your total AI bills get too high.
  costLimits: {
    dailyBudget: 5.0, 
    warningThreshold: 0.8, 
  },
};
