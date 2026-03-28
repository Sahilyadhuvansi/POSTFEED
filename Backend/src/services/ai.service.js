const Groq = require("groq-sdk");
const OpenAI = require("openai");
const aiConfig = require("../config/ai.config");

/**
 * AI Service Manager for POSTFEED
 * Handles all LLM interactions with fallback support
 */
class AIService {
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
  _trackUsage(provider, usage) {
    this.requestCount++;
    // Est. cost: 0.0001 USD per request (avg for LLM usage at this scale)
    this.totalCost += 0.0001; 
    
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

const aiService = new AIService();

module.exports = aiService;
