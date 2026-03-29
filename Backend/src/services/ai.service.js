// ============================================================================
// IMPROVED AI SERVICE - Post Music AI
// ============================================================================
// Fixes: Robust response parsing, input validation, fallback handling
// Status: Production-ready with detailed error logging
// ============================================================================

const Groq = require("groq-sdk");
const crypto = require("crypto");
const aiConfig = require("../config/ai.config");
const { analytics } = require("./ai.performance-analytics");

// v4/v5 HARDENING REFINEMENTS
const DAILY_COST_LIMIT = 5.0; // $5.00 limit
const MAX_CACHE_SIZE = 100;    // Number of entries
const MAX_PAYLOAD_SIZE = 50000; // 50KB soft limit
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const SUSPICIOUS_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s+prompt/i,
  /act\s+as\s+/i,
  /dan\s+mode/i,
  /jailbreak/i
];

/**
 * Response Validation Schema
 */
const ResponseSchema = {
  JSON_ARRAY: "json_array",      // Expect ["item1", "item2", ...]
  JSON_OBJECT: "json_object",    // Expect { ... }
  PLAIN_TEXT: "plain_text",      // Expect any text
  STRUCTURED_JSON: "structured"  // Expect specific schema
};

/**
 * AI Service Manager - IMPROVED VERSION
 * Handles all LLM interactions with robust parsing and validation
 */
class AIService {
  constructor() {
    if (aiConfig.groq.enabled) {
      this.groq = new Groq({
        apiKey: aiConfig.groq.apiKey,
      });
    }

    this.requestCount = 0;
    this.totalCost = 0;
    this.failureLog = [];

    // v5: atomic stats and cache
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Enhanced chat with input validation
   */
  async chat(messages, options = {}) {
      const {
        temperature = 0.7,
        maxTokens = 4096,
        systemPrompt = null,
        responseSchema = ResponseSchema.PLAIN_TEXT,
        strict = false,
      } = options;

      const cacheKey = this._generateCacheKey({ messages, systemPrompt, temperature, responseSchema });

      try {
        // ─── Step 0: Cache Check (v5) ───
        const cachedEntry = this.cache.get(cacheKey);
        if (cachedEntry) {
          if (Date.now() - cachedEntry.timestamp < CACHE_TTL) {
            this.recordHit();
            return cachedEntry.value;
          }
          this.cache.delete(cacheKey); // Expired
        }
        this.recordMiss();

        // ─── Step 1: Validate Input ───
        const validation = this._validateInput(messages);
        if (!validation.valid) {
          return this._createErrorResponse("Invalid input format", validation.error);
        }

        // ─── Step 1.5: Circuit Breaker Check ───
        const dailyReport = analytics.getComprehensiveReport();
        const currentDailyCost = parseFloat(dailyReport.summary.totalCost);
        if (currentDailyCost >= DAILY_COST_LIMIT) {
          return this._createErrorResponse(
            "Service quota exceeded",
            "Daily AI usage limit reached. Circuit breaker active."
          );
        }

        // ─── Step 2: Check Service Config ───
        if (!this.groq) {
          return this._createErrorResponse(
            "Service unavailable",
            "Groq API not configured"
          );
        }

        // ─── Step 3: Make API Call ───
        const rawResponse = await this._groqChat(
          messages,
          systemPrompt,
          temperature,
          maxTokens
        );

        if (!rawResponse.success) {
          return rawResponse; // Error already formatted
        }

        // ─── Step 4: Parse & Validate Response ───
        const parsed = this._parseResponse(
          rawResponse.content,
          responseSchema,
          strict
        );

        const finalResponse = {
          content: parsed.content,
          model: "groq",
          usage: rawResponse.usage,
          status: "success",
          raw: parsed.raw,  // Include raw for debugging
          parseSuccess: parsed.success
        };

        // ─── Step 5: Set Cache (v5) ───
        this._setCache(cacheKey, finalResponse);

        return finalResponse;

    } catch (error) {
      console.error("[AI-Service-Critical]", error.message);
      this._logFailure("chat", error);
      
      return this._createErrorResponse(
        "AI service error",
        error.message
      );
    }
  }

  /**
   * ─── INPUT VALIDATION ───
   */
  _validateInput(messages) {
    if (!Array.isArray(messages)) {
      return { valid: false, error: "Messages must be an array" };
    }

    if (messages.length === 0) {
      return { valid: false, error: "Messages array cannot be empty" };
    }

    for (let msg of messages) {
      if (!msg.role || !msg.content) {
        return { valid: false, error: "Each message must have role and content" };
      }

      if (!["user", "assistant", "system"].includes(msg.role)) {
        return { valid: false, error: `Invalid role: ${msg.role}` };
      }

      if (typeof msg.content !== "string") {
        return { valid: false, error: "Message content must be a string" };
      }

      // Risk-Scoring Injection Guard
      let riskScore = 0;
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(msg.content)) {
          riskScore += 1;
        }
      }

      if (riskScore >= 2) {
        return { valid: false, error: "High-confidence prompt injection detected" };
      }

      // Check for extreme input sizes (prevent token waste)
      if (msg.content.length > 500) {
        return { valid: false, error: "Message too long (max 500 chars for AI safety)" };
      }
    }

    return { valid: true };
  }

  /**
   * ─── RESPONSE PARSING (Enhanced) ───
   * Handles multiple output formats robustly
   */
  _parseResponse(text, schema = ResponseSchema.PLAIN_TEXT, strict = false) {
    const raw = text;

    try {
      if (schema === ResponseSchema.JSON_OBJECT) {
        const json = this._extractJSON(text, "object");
        if (json === null && strict) {
          throw new Error("Could not extract JSON object from response");
        }
        return { 
          content: json || {}, 
          success: json !== null,
          raw 
        };
      }

      if (schema === ResponseSchema.JSON_ARRAY) {
        const json = this._extractJSON(text, "array");
        if (json === null && strict) {
          throw new Error("Could not extract JSON array from response");
        }
        return { 
          content: json || [], 
          success: json !== null,
          raw 
        };
      }

      if (schema === ResponseSchema.STRUCTURED_JSON) {
        const json = this._extractJSON(text, "object");
        if (json === null && strict) {
          throw new Error("Could not extract structured JSON from response");
        }
        return { 
          content: json || {}, 
          success: json !== null,
          raw 
        };
      }

      // PLAIN_TEXT (default)
      return {
        content: text.trim(),
        success: true,
        raw
      };

    } catch (error) {
      console.error("[Parse-Error]", error.message, { text: text.substring(0, 100) });
      return {
        content: strict ? null : text.trim(),
        success: false,
        error: error.message,
        raw
      };
    }
  }

  /**
   * ─── ROBUST JSON EXTRACTION ───
   * Handles markdown, escaped quotes, arrays, objects
   */
  _extractJSON(text, type = "object") {
    if (!text || typeof text !== "string") return null;

    // Remove markdown code blocks
    let cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^```/gm, "")
      .trim();

    try {
      if (type === "array") {
        // Try to find array pattern [...]
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) return parsed;
        }
      }

      if (type === "object") {
        // Try to find object pattern {...}
        const objectMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          const parsed = JSON.parse(objectMatch[0]);
          if (typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
          }
        }
      }

      // Fallback: try to parse the entire string
      const parsed = JSON.parse(cleaned);
      if (type === "array" && Array.isArray(parsed)) return parsed;
      if (type === "object" && typeof parsed === "object") return parsed;

    } catch (e) {
      console.error("[JSON-Extract-Failed]", e.message, { snippet: cleaned.substring(0, 50) });
    }

    return null;
  }

  /**
   * ─── GROQ API CALL ───
   */
  async _groqChat(messages, systemPrompt, temperature, maxTokens) {
    try {
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
        success: true,
        content: response.choices[0].message.content,
        usage: response.usage,
      };
    } catch (error) {
      console.error("[Groq-API-Error]", error.message);
      this._logFailure("groq_api", error);
      
      return {
        success: false,
        error: error.message,
        usage: null
      };
    }
  }

  /**
   * ─── ERROR RESPONSE FORMATTING ───
   */
  _createErrorResponse(title, detail) {
    return {
      content: `Error: ${title}. ${detail}`,
      model: "error-fallback",
      usage: null,
      status: "error",
      error: { title, detail }
    };
  }

  /**
   * ─── USAGE TRACKING ───
   */
  _trackUsage(provider, usage) {
    this.requestCount++;
    if (usage && usage.total_tokens) {
      // Estimate cost: $0.05 per 1M input tokens, $0.15 per 1M output tokens (Groq pricing)
      const estimatedCost = (usage.prompt_tokens * 0.00000005) + (usage.completion_tokens * 0.00000015);
      this.totalCost += estimatedCost;
    } else {
      this.totalCost += 0.0001; // Fallback estimate
    }

    if (this.requestCount % 10 === 0) {
      console.log(`[AI-Stats] Requests: ${this.requestCount}, Cost: $${this.totalCost.toFixed(4)}`);
    }
  }

  /**
   * ─── FAILURE LOGGING ───
   */
  _logFailure(component, error) {
    this.failureLog.push({
      component,
      error: error.message,
      timestamp: new Date(),
      stack: error.stack
    });

    // Keep last 100 failures
    if (this.failureLog.length > 100) {
      this.failureLog.shift();
    }
  }

  /**
   * Clear failure log (admin function)
   */
  clearFailureLog() {
    this.failureLog = [];
  }

  // ─── Atomic Stats (v5) ───
  recordHit() { this.hits++; }
  recordMiss() { this.misses++; }

  // ─── Hash-Safe Caching (v5) ───
  _generateCacheKey(params) {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(params))
      .digest("hex");
  }

  _setCache(key, value) {
    // Memory Guard: Don't cache oversized payloads
    if (JSON.stringify(value).length > MAX_PAYLOAD_SIZE) return;

    // FIFO Eviction
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      totalCost: this.totalCost.toFixed(4),
      avgCostPerRequest: this.requestCount > 0 
        ? (this.totalCost / this.requestCount).toFixed(6)
        : 0,
      cache: {
        size: this.cache.size,
        hits: this.hits,
        misses: this.misses,
        hitRate: (this.hits + this.misses) > 0 
          ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(2) + "%"
          : "0%"
      },
      recentFailures: this.failureLog.slice(-5),
      status: this.groq ? "operational" : "unconfigured"
    };
  }
}

const aiService = new AIService();

module.exports = aiService;
