const Groq = require("groq-sdk");
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

    this.requestCount = 0;
    this.totalCost = 0;
  }

  /**
   * Generate chat completion
   * Uses Groq LPU technology for low-latency responses
   */
  async chat(messages, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = null,
    } = options;

    try {
      // Step 1: Verify service configuration
      if (!this.groq) {
        console.warn("[AI-Warn] Groq service is not configured (missing API Key).");
        return {
          content: "AI assistant is taking a short break. Please try again later.",
          model: "fallback",
          usage: null,
          status: "unavailable"
        };
      }

      // Step 2: Attempt to use Groq for the fastest response
      return await this._groqChat(messages, systemPrompt, temperature, maxTokens);

    } catch (error) {
      // Step 3: Structured Error Handling (Log internally, safe return for UI)
      console.error("[AI-System-Error] Critical failure in Groq interaction:", error.message);
      
      // Return a safe fallback object to avoid crashing the request lifecycle
      return {
        content: "The AI assistant is temporarily offline for maintenance. Our team is tuning the model!",
        model: "safe-fallback",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        error: true,
        status: "error"
      };
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
      status: "success"
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
