# Post Music AI - Quick Reference & Troubleshooting

## 🚀 Quick Start (5 minutes)

### 1. Deploy Fixes
```bash
cd POST_MUSIC-main/Backend
cp ../ai.service.improved.js src/services/ai.service.js
cp ../ai.controller.improved.js src/features/ai/ai.controller.js
npm test
```

### 2. Verify Installation
```bash
curl http://localhost:3000/api/ai/stats
# Should return: { "status": "operational", "requestCount": 0 }
```

### 3. Test One Endpoint
```bash
curl -X POST http://localhost:3000/api/ai/generate-caption \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"context":"new song","mood":"happy","musicTitle":"Test"}'
```

---

## 📊 System Prompts Reference

### Copy-Paste Ready Prompts

#### Caption Generation
```javascript
`You are a professional social media strategist specializing in music content.
Your task: Generate Instagram captions for music artists.

REQUIREMENTS:
1. Keep EXACTLY 150-200 characters
2. Include exactly 1-2 relevant emojis
3. Be engaging and on-brand
4. Match the emotional tone provided
5. Return ONLY the caption text, nothing else

DO NOT:
- Add hashtags
- Add song credits
- Explain your response
- Add line breaks`
```

#### Hashtag Generation
```javascript
`You are a music marketing specialist who creates trending hashtag strategies.
Your task: Suggest hashtags for music posts.

OUTPUT FORMAT: Return ONLY a valid JSON array of 5-8 hashtags.
Example: ["musicproducer", "newmusic", "hiphop", "beatmaker"]

REQUIREMENTS:
1. Each hashtag must be relevant to the music context
2. Mix of popular (>1M posts) and niche hashtags
3. No spaces, special characters, or # symbols in the array
4. Only lowercase
5. Return the JSON array ONLY - no explanation`
```

---

## 🔧 Troubleshooting Guide

### Issue: "Parse Success Rate < 95%"

**Symptom**: `parseSuccess: false` in responses

**Quick Fixes**:
```javascript
// 1. Lower the temperature (more consistent)
temperature: 0.5,  // Was 0.7

// 2. Add explicit format instruction
"Return ONLY the JSON array. No explanation or markdown."

// 3. Use examples in prompt
"Example: ['tag1', 'tag2', 'tag3']"
```

---

### Issue: "API Errors in Production"

**Check Logs**:
```bash
grep "\[AI-" logs/application.log | head -20
grep "error" logs/application.log | grep "ai"
```

**Common Causes**:
| Error | Cause | Fix |
|-------|-------|-----|
| `GROQ_API_KEY undefined` | Missing env var | Set GROQ_API_KEY in .env |
| `Rate limit exceeded` | Too many requests | Check rate limiter config |
| `Cannot parse JSON` | AI format wrong | Update system prompt |
| `Timeout after 30s` | Slow API | Increase timeout or check Groq |

---

### Issue: "Inconsistent Responses"

**Debug Steps**:
```bash
# 1. Check if prompt is being used consistently
curl http://localhost:3000/api/ai/debug \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "Your prompt here",
    "messages": [{"role": "user", "content": "test"}],
    "temperature": 0.5
  }'

# 2. Lower temperature
temperature: 0.1,  // Lower = more consistent

# 3. Add strict validation
strict: true,  // Reject invalid responses
```

---

### Issue: "User Getting Same Fallback Response"

**Problem**: Fallback being returned too often

**Solution**:
```javascript
// Check what's failing
GET /api/ai/stats
// Look at recentFailures array

// Debug the AI response
POST /api/ai/debug
// Review the 'raw' field

// Adjust prompt if needed
// Make it more specific and constrained
```

---

## 🌡️ Temperature Tuning

### Quick Reference Table

```
Temperature | Use Case | Result
0.1         | JSON     | 95% consistent format
0.3         | Structured | 90% consistent
0.5         | Hashtags | 85% consistent, 15% creative
0.6         | Captions | 80% consistent, 20% creative
0.7         | General chat | 70% consistent, 30% creative
0.9         | Creative | 50% consistent, 50% creative
```

### What to Adjust

```javascript
// If responses are too similar:
temperature: 0.6,  // Increase from 0.5

// If responses are inconsistent:
temperature: 0.3,  // Decrease from 0.5

// If JSON keeps failing:
temperature: 0.1,  // Lower to minimum
```

---

## 📈 Performance Optimization

### Enable Caching
```javascript
// Reduce API calls by 30-50%
const aiCache = new Map();

async function getCachedResponse(key) {
  if (aiCache.has(key)) return aiCache.get(key);
  
  const response = await aiService.chat(...);
  aiCache.set(key, response);
  return response;
}
```

### Batch Requests
```javascript
// Instead of 10 separate requests
// Combine into one request with batch context
const batch = {
  messages: [
    { role: "user", content: "Context about all 10 songs..." }
  ]
};
```

### Monitor Costs
```bash
# Check every few requests
curl http://localhost:3000/api/ai/stats

# Look for:
# - totalCost: Should be < $0.001 per request
# - recentFailures: Should be empty or minimal
```

---

## 🧪 Testing Endpoints

### Test All Features

```bash
#!/bin/bash

# Set your token
TOKEN="your_auth_token"

echo "1. Testing Caption Generation..."
curl -X POST http://localhost:3000/api/ai/generate-caption \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"context":"new song","mood":"happy","musicTitle":"Test"}'

echo -e "\n2. Testing Hashtag Generation..."
curl -X POST http://localhost:3000/api/ai/suggest-hashtags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"caption":"New track!","musicTitle":"Test","genre":"EDM"}'

echo -e "\n3. Testing Chat - Structured..."
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Show latest songs"}]}'

echo -e "\n4. Testing Chat - General..."
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How do I upload music?"}]}'

echo -e "\n5. Getting Statistics..."
curl http://localhost:3000/api/ai/stats
```

---

## 🐛 Debug Mode

### Enable Debug Logging

```javascript
// In ai.service.js, add at top:
const DEBUG = process.env.AI_DEBUG === "true";

// In methods:
if (DEBUG) {
  console.log("[AI-DEBUG] Request:", {
    model: aiConfig.groq.model,
    temperature: options.temperature,
    messageLength: messages.length
  });
}
```

### Run with Debug
```bash
AI_DEBUG=true npm start
# Watch console for [AI-DEBUG] messages
```

### Test Debug Endpoint
```bash
curl -X POST http://localhost:3000/api/ai/debug \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "You are helpful",
    "messages": [{"role": "user", "content": "test"}]
  }'

# Response includes:
# - raw: The exact text from AI
# - parseSuccess: Whether JSON parsing worked
# - preview: First 200 chars
```

---

## 📋 Checklist: Before Going Live

- [ ] All tests passing: `npm test`
- [ ] Stats endpoint working: `GET /api/ai/stats`
- [ ] No `[AI-Error]` in logs
- [ ] Parse success rate > 95%
- [ ] Fallback rate < 5%
- [ ] Response times < 2 seconds
- [ ] All endpoints tested manually
- [ ] Fallback values look good
- [ ] Temperature settings appropriate
- [ ] Monitoring dashboard set up

---

## 📊 Key Metrics Dashboard

### Health Check Command
```bash
curl http://localhost:3000/api/ai/stats | jq '.'
```

### What to Look For
```json
{
  "requestCount": 150,      // ✅ Should increase over time
  "totalCost": "$0.00023",  // ✅ Should be < $0.001 per request
  "recentFailures": [],     // ✅ Should be empty
  "status": "operational"   // ✅ Should say "operational"
}
```

### Red Flags
| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| totalCost | > $0.01 | Reduce max_tokens or cache more |
| recentFailures | > 3 | Review prompts, check Groq API |
| Parse errors | > 5% | Lower temperature |
| Response time | > 3s | Check Groq latency, increase timeout |

---

## 🔄 Common Adjustments

### If Responses Are Too Short
```javascript
// Increase max tokens
maxTokens: 1024,  // Was 512
```

### If Responses Are Too Long
```javascript
// Decrease max tokens
maxTokens: 256,  // Was 512
```

### If Responses Are Too Creative
```javascript
// Lower temperature
temperature: 0.3,  // Was 0.7
```

### If Responses Are Too Generic
```javascript
// Raise temperature slightly
temperature: 0.7,  // Was 0.5
```

### If JSON Parsing Often Fails
```javascript
// Add stricter prompt
"Return ONLY valid JSON. No explanation. No markdown."
temperature: 0.1  // Minimum

// Or use fallback
strict: true,  // Fail fast and use fallback
```

---

## 🚨 Emergency Rollback

```bash
# Quick rollback to previous version
cp src/services/ai.service.js.bak src/services/ai.service.js
cp src/features/ai/ai.controller.js.bak src/features/ai/ai.controller.js
npm restart

# Verify rollback
curl http://localhost:3000/api/ai/stats
```

---

## 📞 Getting Help

### Check Documentation
1. **Issues Analysis**: Problem details
2. **Implementation Guide**: Step-by-step fixes
3. **Best Practices**: Advanced techniques

### Debug Steps
1. Check error in logs
2. Get response from `/api/ai/stats`
3. Test with `/api/ai/debug` endpoint
4. Review system prompt
5. Adjust temperature if needed

### When Stuck
1. Lower temperature to 0.1
2. Add more constraints to prompt
3. Provide examples in prompt
4. Increase maxTokens if incomplete
5. Check Groq API status

---

## 🎯 Success Indicators

### ✅ Everything Working Well
- Parse success rate 95%+
- Error rate < 2%
- Average response time < 1.5s
- Fallback rate < 5%
- User satisfaction > 4/5

### 🟡 Minor Issues (Adjust Settings)
- Parse success 85-95%: Lower temperature
- Error rate 2-5%: Check logs
- Response time 2-3s: Check Groq
- Fallback rate 5-10%: Better prompt

### 🔴 Major Issues (Review Approach)
- Parse success < 85%: Redesign prompt
- Error rate > 5%: Check configuration
- Response time > 3s: Increase timeout
- Fallback rate > 10%: Major prompt review

---

## Quick Copy-Paste Solutions

### Solution 1: Fix JSON Parsing
```javascript
// In ai.service.js _parseResponse method:
const json = this._extractJSON(text, "object");
if (json === null && strict) {
  throw new Error("Could not extract JSON object");
}
```

### Solution 2: Add Input Validation
```javascript
// In ai.controller.js:
const validation = validateCaptionInput(context, mood, musicTitle);
if (!validation.valid) {
  return res.status(400).json({
    success: false,
    details: validation.errors
  });
}
```

### Solution 3: Better Fallback
```javascript
// On error, return something useful:
res.status(200).json({
  success: true,
  data: { caption: "Check out my new music! 🎵" },
  source: "fallback"
});
```

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
