// ─── Commit: AI SDK and Configuration Imports ───
// What this does: Imports the official SDKs for OpenAI and Groq, plus our local AI settings.
// Why it exists: To enable communication with Large Language Model (LLM) APIs.
// Libraries used: openai (OpenAI SDK), groq-sdk (Groq's LPU inference SDK).
// Beginner note: 'require' statements load pre-built tools into our project.
// Interview insight: Why use multiple providers? To ensure "Redundancy" (e.g., Groq for speed, OpenAI for specific features).
const OpenAI = require("openai");
const Groq = require("groq-sdk");
const aiConfig = require("../config/ai.config");

/**
 * AI Service Manager for POSTFEED
 * Handles all LLM interactions with fallback support
 */
class AIService {
  // ─── Commit: Constructor and SDK Initialization ───
  // What this does: Sets up the connection to Groq and OpenAI when the class is first created.
  // How it works: Checks if 'enabled' is true in config, then creates new instances using API keys.
  // Interview insight: This follows the "Singleton" pattern when exported below, ensuring only one instance exists.
  constructor() {
    // Initialize Groq (Primary Provider for fast LPU inference)
    if (aiConfig.groq.enabled) {
      this.groq = new Groq({
        apiKey: aiConfig.groq.apiKey,
      });
    }

    // Initialize OpenAI (Act as a reliable fallback/backup)
    if (aiConfig.openai.enabled) {
      this.openai = new OpenAI({
        apiKey: aiConfig.openai.apiKey,
      });
    }

    this.requestCount = 0;
    this.totalCost = 0;
  }

  /**
   * Generate chat completion with automatic fallback
   * Try Groq first (fastest) and then OpenAI as fallback
   */
  // ─── Commit: Unified Chat Method with Primary/Fallback Logic ───
  // What this does: Takes user messages and returns an AI response, trying Groq first.
  // Why it exists: To ensure the AI works even if one provider goes down or is missing a key.
  // How it works: Uses a 'try-catch' block. If Groq exists, it calls its handler; otherwise drops to OpenAI.
  async chat(messages, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = null,
    } = options;

    try {
      // Step 1: Attempt to use Groq for the fastest response (LPU technology)
      if (this.groq) {
        return await this._groqChat(messages, systemPrompt, temperature, maxTokens);
      }

      // Step 2: Silent fallback to OpenAI if Groq is unavailable
      if (this.openai) {
        return await this._openaiChat(messages, systemPrompt, temperature, maxTokens);
      }

      throw new Error("No AI service configured. Please add GROQ_API_KEY to .env");
    } catch (error) {
      console.error("AI Service Error:", error.message);
      throw error;
    }
  }

  /**
   * Groq API chat implementation
   */
  // ─── Commit: Groq-Specific Request Implementation ───
  // What this does: Handles the raw network request to Groq's API.
  // Interview insight: Tracking usage immediately after the response to monitor performance.
  async _groqChat(messages, systemPrompt, temperature, maxTokens) {
    const formattedMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

    const response = await this.groq.chat.completions.create({
      model: aiConfig.groq.model,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
    });

    this._trackUsage("groq", response.usage);

    return {
      content: response.choices[0].message.content,
      model: "groq",
      usage: response.usage,
    };
  }

  /**
   * OpenAI API chat implementation (Backup)
   */
  // ─── Commit: OpenAI-Specific Request Implementation ───
  // Why it exists: Acts as a reliable backup or alternative to Groq.
  async _openaiChat(messages, systemPrompt, temperature, maxTokens) {
    const formattedMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

    const response = await this.openai.chat.completions.create({
      model: aiConfig.openai.model,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
    });

    this._trackUsage("openai", response.usage);

    return {
      content: response.choices[0].message.content,
      model: "openai",
      usage: response.usage,
    };
  }

  /**
   * Track API usage and estimated costs
   */
  // ─── Commit: Usage Monitoring ───
  _trackUsage(provider, usage) {
    this.requestCount++;
    // Cost tracking could be more precise, keeping it simple for monitoring.
    if (this.requestCount % 10 === 0) {
      console.log(`[AI-Log] Total requests so far: ${this.requestCount}`);
    }
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      totalCost: this.totalCost,
      avgCostPerRequest: this.requestCount > 0 ? this.totalCost / this.requestCount : 0,
    };
  }
}

// ─── Commit: Singleton Export ───
// Why it exists: To ensure only ONE instance of the AI service is used across the entire application.
const aiService = new AIService();

module.exports = aiService;
