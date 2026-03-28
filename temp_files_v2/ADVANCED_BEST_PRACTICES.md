# Advanced: AI Prompt Engineering Best Practices

## Golden Rules for Reliable AI Responses

### Rule 1: Be Specific, Not Vague
```javascript
// ❌ VAGUE
"Generate a caption"

// ✅ SPECIFIC
"Generate an Instagram caption (150-200 characters) with exactly 1-2 emojis 
for a music artist announcing a new track release"
```

### Rule 2: State Output Format Explicitly
```javascript
// ❌ VAGUE
"Return hashtags"

// ✅ SPECIFIC - State exact format
"Return ONLY a JSON array of hashtags. 
Example: ['musicproducer', 'newmusic']
Do not include any text before or after the array."
```

### Rule 3: Use Constraints, Not Suggestions
```javascript
// ❌ SUGGESTION (AI ignores)
"Try to keep it under 200 characters"

// ✅ CONSTRAINT (AI follows)
"MUST be between 150-200 characters exactly. 
Responses outside this range will be rejected."
```

### Rule 4: List What NOT to Do
```javascript
// ❌ NO DO-NOT LIST
"Write a caption for a music track"

// ✅ WITH CLEAR DO-NOT LIST
"Write a caption for a music track.
DO NOT:
- Include hashtags
- Add song credits
- Explain your response
- Add promotional links"
```

### Rule 5: Provide Examples
```javascript
// ❌ NO EXAMPLES
"Return hashtags as a JSON array"

// ✅ WITH EXAMPLES
"Return hashtags as a JSON array.
Example: ['musicproducer', 'beatmaker', 'hiphop']
Each hashtag must be:
- Lowercase only
- No # symbol
- 3-25 characters"
```

---

## Prompt Template for Reliable Outputs

Use this template for consistent results:

```javascript
const createReliablePrompt = (task, requirements, constraints, examples, format) => {
  return `You are a ${ROLE}.
Your task: ${task}.

REQUIREMENTS:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

CONSTRAINTS:
${constraints.map((c, i) => `- ${c}`).join('\n')}

EXAMPLES:
${examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}

OUTPUT FORMAT:
${format}

IMPORTANT: Respond with ONLY the requested output. No explanation needed.`;
};

// Usage:
const prompt = createReliablePrompt(
  task: "Generate Instagram captions for musicians",
  requirements: [
    "Keep exactly 150-200 characters",
    "Include exactly 1-2 relevant emojis",
    "Match the emotional tone provided",
    "Be engaging and authentic"
  ],
  constraints: [
    "No hashtags allowed",
    "No song credits in caption",
    "No line breaks or formatting",
    "Must be grammatically correct"
  ],
  examples: [
    "Just dropped my new single 'Midnight Dreams' 🌙 Ready to take you on a journey ✨",
    "Friday vibes! New beat just went live 🔥 Let me know what you think 💯"
  ],
  format: "Return the caption as plain text only"
);
```

---

## Temperature & Model Selection Guide

### When to Use Low Temperature (0.1 - 0.3)
**Goal**: Precise, predictable, consistent output

**Best For**:
- JSON generation
- Structured data
- Technical writing
- Content moderation
- Code generation
- Data extraction

**Example**:
```javascript
await aiService.chat(messages, {
  temperature: 0.1,  // Almost deterministic
  responseSchema: "json_object",
  strict: true
});
```

---

### When to Use Medium Temperature (0.4 - 0.7)
**Goal**: Balance consistency with creativity

**Best For**:
- Copy writing
- Recommendations
- Explanations
- General chat
- Content generation with variety

**Example**:
```javascript
await aiService.chat(messages, {
  temperature: 0.6,  // Good balance
  responseSchema: "plain_text"
});
```

---

### When to Use High Temperature (0.8 - 1.0)
**Goal**: Creative, diverse, varied output

**Best For**:
- Creative writing
- Brainstorming
- Poetry/art
- Generating multiple options
- Exploring ideas

**⚠️ NOT recommended for Post Music AI** - too unpredictable

---

## Model Selection for Post Music

### Current: llama-3.1-8b-instant
**Pros**:
- Fast inference (good for real-time)
- Cheap ($0.05 per 1M input tokens)
- Handles JSON well

**Cons**:
- Less creative than larger models
- Sometimes misses nuance

**Best Use**: Caption generation, hashtags, structured queries

---

### Alternative: llama-3.1-70b-versatile (if needed)
**Pros**:
- Better reasoning
- Better JSON compliance
- Better long context

**Cons**:
- Slower (300ms vs 50ms)
- More expensive ($0.59 per 1M input tokens)

**Best Use**: Complex recommendations, sentiment analysis

---

### When to Switch Models

If you're seeing:
- ❌ JSON parse failures > 10%
- ❌ Generic/meaningless recommendations
- ❌ Inconsistent output format

Then try:
```javascript
// In ai.config.js
module.exports = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-70b-versatile",  // Larger model
    // Rest of config...
  }
};
```

---

## Advanced Response Validation Techniques

### Schema-Based Validation

```javascript
/**
 * Validate response against expected schema
 */
const validateResponseSchema = (response, schema) => {
  if (schema.type === "array") {
    if (!Array.isArray(response)) return false;
    if (response.length < schema.minItems || response.length > schema.maxItems) return false;
    
    // Validate each item
    return response.every(item => {
      if (schema.itemType === "string") return typeof item === "string";
      if (schema.itemType === "number") return typeof item === "number";
      if (schema.itemType === "object") {
        return schema.properties.every(prop => prop in item);
      }
      return true;
    });
  }

  if (schema.type === "object") {
    if (typeof response !== "object" || Array.isArray(response)) return false;
    return schema.required.every(prop => prop in response);
  }

  if (schema.type === "string") {
    if (typeof response !== "string") return false;
    if (schema.minLength && response.length < schema.minLength) return false;
    if (schema.maxLength && response.length > schema.maxLength) return false;
    if (schema.pattern && !schema.pattern.test(response)) return false;
    return true;
  }

  return false;
};

// Define schema for hashtags
const hashtagSchema = {
  type: "array",
  itemType: "string",
  minItems: 5,
  maxItems: 8,
  properties: []
};

const captionSchema = {
  type: "string",
  minLength: 150,
  maxLength: 200,
  pattern: /[\p{Emoji}]/u  // Must contain emoji
};

// Usage:
const aiResponse = await aiService.chat(...);
if (validateResponseSchema(aiResponse.content, captionSchema)) {
  // Response is valid!
} else {
  // Fallback or retry
}
```

---

## Debugging Failed Responses

### Add Detailed Logging

```javascript
const aiService = {
  async chat(messages, options = {}) {
    console.log("[AI-Request]", {
      model: aiConfig.groq.model,
      temperature: options.temperature,
      systemPrompt: options.systemPrompt?.substring(0, 100),
      userMessage: messages[messages.length - 1].content.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    try {
      const response = await this._groqChat(...);
      
      console.log("[AI-Response]", {
        success: true,
        responseLength: response.content.length,
        tokens: response.usage.total_tokens,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error("[AI-Error]", {
        error: error.message,
        code: error.code,
        statusCode: error.status,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }
};
```

### Create Debug Endpoint

```javascript
exports.debugChat = async (req, res) => {
  const { messages, systemPrompt, temperature = 0.7 } = req.body;

  try {
    const response = await aiService.chat(messages, {
      systemPrompt,
      temperature,
      responseSchema: "plain_text"
    });

    res.json({
      success: true,
      response: response.content,
      raw: response.raw,
      parseSuccess: response.parseSuccess,
      model: response.model,
      usage: response.usage,
      
      // Debug info
      responseLength: response.content.length,
      type: typeof response.content,
      preview: response.content.substring(0, 200)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        temperature,
        messageCount: messages.length,
        systemPromptLength: systemPrompt?.length
      }
    });
  }
};
```

Test with:
```bash
curl -X POST http://localhost:3000/api/ai/debug \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "You are a music expert. Return a 5-word description of EDM.",
    "messages": [{"role": "user", "content": "Describe electronic dance music"}],
    "temperature": 0.5
  }'
```

---

## Common Failure Patterns & Solutions

### Pattern 1: JSON Wrapped in Extra Text
```javascript
// AI returns:
"Here are the hashtags: ["music", "artist"]
Hope this helps!"

// Solution: Use better prompt
"Return ONLY the JSON array. No explanation."

// Or parse smartly:
const jsonMatch = response.match(/\[[\s\S]*\]/);
if (jsonMatch) JSON.parse(jsonMatch[0]);
```

### Pattern 2: Wrong JSON Structure
```javascript
// AI returns:
{"hashtags": ["music", "artist"]}  // Wrong structure

// Expected:
["music", "artist"]  // Direct array

// Solution:
"Return ONLY the JSON array of hashtags (not wrapped in an object).
Example: ["hashtag1", "hashtag2"]"
```

### Pattern 3: Mixed Formats
```javascript
// AI alternates between:
// 1. ["tag1", "tag2"]
// 2. ["tag1", "tag2", ...]
// 3. "tag1, tag2"

// Solution: More strict prompt
"Return ONLY a JSON array.
Format: ["lowercase-tag-1", "lowercase-tag-2"]
Each tag: 3-25 chars, lowercase, no spaces"
```

### Pattern 4: Incomplete JSON
```javascript
// AI returns truncated:
["tag1", "tag2", "tag3"  // Missing closing bracket

// Solution: Check for complete JSON
if (!response.match(/[\}\]]\s*$/)) {
  // Incomplete JSON
  return fallback;
}
```

---

## Performance Optimization

### Cache Expensive Calls

```javascript
class AICache {
  constructor(ttl = 3600) {
    this.cache = new Map();
    this.ttl = ttl * 1000;
  }

  getCacheKey(systemPrompt, userMessage) {
    // Create consistent cache key
    const hash = require('crypto')
      .createHash('md5')
      .update(`${systemPrompt}||${userMessage}`)
      .digest('hex');
    return hash;
  }

  async getCachedResponse(systemPrompt, userMessage) {
    const key = this.getCacheKey(systemPrompt, userMessage);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.response;
    }

    return null;
  }

  setCache(systemPrompt, userMessage, response) {
    const key = this.getCacheKey(systemPrompt, userMessage);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Usage:
const aiCache = new AICache(3600); // 1 hour TTL

exports.generateCaption = async (req, res) => {
  const cacheHit = await aiCache.getCachedResponse(
    SYSTEM_PROMPTS.captionGeneration,
    userPrompt
  );

  if (cacheHit) {
    return res.json({ success: true, data: cacheHit, source: "cache" });
  }

  const response = await aiService.chat(...);
  aiCache.setCache(SYSTEM_PROMPTS.captionGeneration, userPrompt, response);

  res.json({ success: true, data: response, source: "api" });
};
```

---

## Testing AI Responses

### Unit Tests for Prompts

```javascript
// test/ai.prompts.test.js
describe("AI Prompt Engineering", () => {
  it("should generate captions within character limit", async () => {
    const response = await aiService.chat(
      [{ role: "user", content: "Generate caption for EDM track" }],
      { systemPrompt: SYSTEM_PROMPTS.captionGeneration, temperature: 0.1 }
    );

    expect(response.content.length).toBeGreaterThanOrEqual(150);
    expect(response.content.length).toBeLessThanOrEqual(200);
  });

  it("should return valid JSON array for hashtags", async () => {
    const response = await aiService.chat(
      [{ role: "user", content: "Suggest hashtags for hip-hop track" }],
      {
        systemPrompt: SYSTEM_PROMPTS.hashtagSuggestion,
        responseSchema: "json_array",
        strict: true
      }
    );

    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThanOrEqual(5);
    expect(response.content.length).toBeLessThanOrEqual(8);
  });

  it("should include emojis in captions", async () => {
    const response = await aiService.chat(...);
    const emojiRegex = /[\p{Emoji}]/u;
    expect(response.content).toMatch(emojiRegex);
  });
});
```

---

## Monitoring Dashboard

Add metrics to your admin dashboard:

```javascript
exports.getAIMetrics = async (req, res) => {
  const stats = aiService.getStats();
  const failureRate = stats.recentFailures.length > 0 
    ? (stats.recentFailures.length / 10 * 100).toFixed(1) 
    : "0";

  res.json({
    success: true,
    metrics: {
      requestCount: stats.requestCount,
      totalCost: stats.totalCost,
      costPerRequest: stats.avgCostPerRequest,
      failureRate: `${failureRate}%`,
      status: stats.status,
      recentFailures: stats.recentFailures
    },
    health: {
      isHealthy: parseFloat(failureRate) < 5,
      recommendation: parseFloat(failureRate) > 10 
        ? "Consider adjusting prompts or switching models"
        : "System operating normally"
    }
  });
};
```

---

## Summary

✅ **Follow these principles for reliable AI**:
1. Be specific and explicit
2. State output format clearly
3. Use constraints, not suggestions
4. List what NOT to do
5. Provide examples
6. Validate responses strictly
7. Cache when possible
8. Monitor failure rates
9. Adjust temperature per task
10. Log everything for debugging

**Expected Results**:
- Parse success rate: > 95%
- Error rate: < 2%
- User satisfaction: > 90%
- Cost per request: < $0.001

Good luck with your AI improvements! 🚀
