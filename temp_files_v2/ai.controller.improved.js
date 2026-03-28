// ============================================================================
// IMPROVED AI CONTROLLER - Post Music AI
// ============================================================================
// Fixes: Expert system prompts, input validation, structured output
// Status: Production-ready with comprehensive error handling
// ============================================================================

const musicRecommendation = require("../../services/music-recommendation.service");
const contentModeration = require("../../services/content-moderation.service");
const aiService = require("../../services/ai.service");
const aiConfig = require("../../config/ai.config");
const Post = require("../posts/posts.model");
const Music = require("../music/music.model");

// Cache configuration
let cachedContext = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000;

/**
 * ============================================================================
 * SYSTEM PROMPTS - EXPERT ENGINEERED FOR RELIABILITY
 * ============================================================================
 */

const SYSTEM_PROMPTS = {
  // ─── CAPTION GENERATION ───
  captionGeneration: `You are a professional social media strategist specializing in music content.
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
- Add line breaks`,

  // ─── HASHTAG SUGGESTION ───
  hashtagSuggestion: `You are a music marketing specialist who creates trending hashtag strategies.
Your task: Suggest hashtags for music posts.

OUTPUT FORMAT: Return ONLY a valid JSON array of 5-8 hashtags.
Example: ["musicproducer", "newmusic", "hiphop", "beatmaker"]

REQUIREMENTS:
1. Each hashtag must be relevant to the music context
2. Mix of popular (>1M posts) and niche hashtags
3. No spaces, special characters, or # symbols in the array
4. Only lowercase
5. Return the JSON array ONLY - no explanation

Caption context: {caption}
Track: {musicTitle}
Genre: {genre}`,

  // ─── MOOD PLAYLIST ───
  moodPlaylist: `You are an AI DJ who curates mood-based playlists.
Your task: Create a brief description of a {mood} mood playlist.

REQUIREMENTS:
1. Write 1-2 sentences maximum
2. Be creative and evocative
3. Describe the emotional vibe
4. Don't mention specific songs
5. Return text only`,

  // ─── TRENDING ANALYSIS ───
  trendingAnalysis: `You are a music trends analyst.
Your task: Analyze what's trending and summarize in one sentence.

REQUIREMENTS:
1. Identify the common theme/mood
2. One sentence only (max 20 words)
3. Be specific and insightful
4. Don't list song titles
5. Return text only`,

  // ─── RECOMMENDATION EXPLANATIONS ───
  recommendationExplanations: `You are a personalized music curator.
Your task: Explain why each song matches a user's taste.

OUTPUT FORMAT: Return ONLY a JSON array of short explanations.
Example: ["Perfect for your indie vibe", "Matches your energy level", "Similar to your favorites"]

REQUIREMENTS:
1. One explanation per song (5-8 words each)
2. Be specific about why it matches
3. Return ONLY the JSON array
4. No explanation text before or after the array

User's favorite songs: {userFavorites}
Songs to explain: {recTitles}`,

  // ─── CHAT (Structured Query) ───
  chatStructured: `You are a PostFeed Data Controller. Your role is to return ONLY valid JSON responses.
DO NOT add any text before or after the JSON. DO NOT explain. ONLY JSON.

RESPONSE RULES:
1. For post/song queries, return structured JSON with this exact format
2. Do NOT include markdown code blocks
3. Do NOT include explanations or extra text
4. Do NOT return incomplete JSON

QUERY TYPES:

A) POSTS QUERY (when user asks about posts, feed, latest, etc):
{
  "type": "posts",
  "version": "1.0",
  "query": "user query here",
  "data": [
    {
      "id": "post_id",
      "username": "@username",
      "caption": "post caption",
      "timestamp": "ISO date"
    }
  ]
}

B) SONGS QUERY (when user asks about music, songs, tracks, etc):
{
  "type": "songs",
  "version": "1.0",
  "query": "user query here",
  "data": [
    {
      "id": "song_id",
      "title": "Song Title",
      "artist": "Artist Name",
      "genre": "genre"
    }
  ]
}

C) EMPTY RESULT (if no data matches):
{
  "type": "empty",
  "message": "No matching posts found. Be the first to create one!"
}

APP CONTEXT:
{appContext}

User Query: {userQuery}`,

  // ─── CHAT (General) ───
  chatGeneral: `You are PostFeed AI Assistant - a helpful, friendly guide for the music social platform.

PERSONALITY:
- Helpful and encouraging
- Know about music trends
- Understand social media culture
- Never pretend to have capabilities you lack

RULES:
1. Keep responses under 200 words
2. Be brand-aligned and positive
3. Never claim to be human
4. Never suggest features we don't have
5. Don't give medical/legal advice
6. Recommend existing features when relevant

APP CONTEXT:
{appContext}`,

  // ─── RECOMMENDATION REASONS ───
  recommendationReasons: `You are a music taste expert explaining recommendations.
Your task: Provide brief, specific reasons why songs match a user.

REQUIREMENTS:
1. Be concise (5-10 words per reason)
2. Be specific (not generic)
3. Reference music elements (tempo, mood, artist style)
4. Vary the language across reasons
5. Return ONLY a JSON array of strings`,

  // ─── CONTENT MODERATION ───
  contentModeration: `Analyze the following text for policy violations.
Be strict but fair. Flag only clear violations.

Categories:
- EXPLICIT: Profanity, sexual content
- SPAM: Repetitive promotion, scams
- HARASSMENT: Targeted abuse, threats
- OFF-TOPIC: Not related to music

Return: {"category": "SAFE|EXPLICIT|SPAM|HARASSMENT|OFF-TOPIC", "confidence": 0.95, "reason": "brief explanation"}`
};

/**
 * ============================================================================
 * INPUT VALIDATION FUNCTIONS
 * ============================================================================
 */

/**
 * Validate and sanitize caption generation input
 */
const validateCaptionInput = (context, mood, musicTitle) => {
  const errors = [];

  if (!context || typeof context !== "string" || context.trim().length === 0) {
    errors.push("context is required");
  }
  if (context && context.length > 500) {
    errors.push("context exceeds 500 characters");
  }

  if (!mood || typeof mood !== "string" || mood.trim().length === 0) {
    errors.push("mood is required");
  }
  if (mood && !["happy", "sad", "energetic", "chill", "romantic", "angry", "melancholic"].includes(mood.toLowerCase())) {
    errors.push("mood should be a recognized emotion");
  }

  if (!musicTitle || typeof musicTitle !== "string") {
    errors.push("musicTitle is required");
  }
  if (musicTitle && musicTitle.length > 200) {
    errors.push("musicTitle exceeds 200 characters");
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate hashtag suggestion input
 */
const validateHashtagInput = (caption, musicTitle, genre) => {
  const errors = [];

  if (caption && caption.length > 500) {
    errors.push("caption exceeds 500 characters");
  }
  if (musicTitle && musicTitle.length > 200) {
    errors.push("musicTitle exceeds 200 characters");
  }
  if (genre && genre.length > 100) {
    errors.push("genre exceeds 100 characters");
  }

  return { valid: errors.length === 0, errors };
};

/**
 * ============================================================================
 * IMPROVED ENDPOINT CONTROLLERS
 * ============================================================================
 */

/**
 * @route   POST /api/ai/generate-caption
 * @desc    Generate engaging social media caption
 * @access  Private
 * @improved Input validation, expert prompt, response validation
 */
exports.generateCaption = async (req, res) => {
  try {
    const { context = "", mood = "", musicTitle = "" } = req.body;

    if (!aiConfig.features.captionGeneration) {
      return res.status(503).json({
        success: false,
        error: "Caption generation feature is temporarily unavailable"
      });
    }

    // ─── INPUT VALIDATION ───
    const validation = validateCaptionInput(context, mood, musicTitle);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors
      });
    }

    // ─── BUILD PROMPT ───
    const userPrompt = `Context: ${context}
Track: ${musicTitle}
Mood: ${mood}

Generate a caption that fits this context.`;

    // ─── CALL AI WITH STRICT VALIDATION ───
    const aiRes = await aiService.chat(
      [{ role: "user", content: userPrompt }],
      {
        systemPrompt: SYSTEM_PROMPTS.captionGeneration,
        temperature: 0.6,  // Lower for consistency
        maxTokens: 250,
        responseSchema: "plain_text",
        strict: true
      }
    );

    if (aiRes.status === "error") {
      return res.status(500).json({
        success: false,
        error: "Failed to generate caption",
        fallback: "Check out my new music! 🎵"
      });
    }

    const caption = aiRes.content.trim();

    // ─── VALIDATE CAPTION OUTPUT ───
    if (caption.length < 50 || caption.length > 280) {
      console.warn("[Caption-Length] Unexpected length:", caption.length);
    }

    res.status(200).json({
      success: true,
      data: { caption },
      model: aiRes.model
    });

  } catch (error) {
    console.error("[Caption-Generation-Error]", error);
    res.status(500).json({
      success: false,
      error: "Caption generation encountered an error",
      fallback: "Drop your new track! 🎧"
    });
  }
};

/**
 * @route   POST /api/ai/suggest-hashtags
 * @desc    Suggest relevant hashtags
 * @access  Private
 * @improved Input validation, expert prompt, robust JSON parsing
 */
exports.suggestHashtags = async (req, res) => {
  try {
    const { caption = "", musicTitle = "", genre = "" } = req.body;

    // ─── INPUT VALIDATION ───
    const validation = validateHashtagInput(caption, musicTitle, genre);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors
      });
    }

    // ─── BUILD PROMPT WITH CLEAR SCHEMA ───
    const prompt = SYSTEM_PROMPTS.hashtagSuggestion
      .replace("{caption}", caption || "New music release")
      .replace("{musicTitle}", musicTitle || "Untitled")
      .replace("{genre}", genre || "Electronic");

    const userPrompt = prompt;

    // ─── CALL AI WITH STRICT JSON PARSING ───
    const aiRes = await aiService.chat(
      [{ role: "user", content: userPrompt }],
      {
        temperature: 0.5,  // Lower for consistent formatting
        maxTokens: 250,
        responseSchema: "json_array",  // Expect array
        strict: true  // Fail if can't parse JSON
      }
    );

    if (aiRes.status === "error" || !aiRes.parseSuccess) {
      // ─── INTELLIGENT FALLBACK ───
      const fallbackTags = [
        "musicproducer",
        "newmusic",
        genre ? genre.toLowerCase() : "music",
        "beatmaker",
        "independentartist"
      ].filter(Boolean);

      return res.status(200).json({
        success: true,
        data: { hashtags: fallbackTags, source: "fallback" },
        note: "Using default tags"
      });
    }

    const hashtags = Array.isArray(aiRes.content) ? aiRes.content : [];

    // ─── VALIDATE HASHTAGS ───
    const validHashtags = hashtags
      .filter(tag => typeof tag === "string" && tag.length > 0 && tag.length < 30)
      .slice(0, 8);

    if (validHashtags.length === 0) {
      throw new Error("No valid hashtags generated");
    }

    res.status(200).json({
      success: true,
      data: { hashtags: validHashtags },
      model: aiRes.model
    });

  } catch (error) {
    console.error("[Hashtag-Error]", error);
    res.status(200).json({
      success: true,
      data: {
        hashtags: ["music", "newmusic", "artist", "independent", "musicproduction"],
        source: "fallback"
      }
    });
  }
};

/**
 * @route   POST /api/ai/chat
 * @desc    Intelligent chat with structured data support
 * @access  Public
 * @improved Expert prompts, structured response handling, fallback support
 */
exports.chat = async (req, res) => {
  try {
    const { messages = [] } = req.body;

    // ─── INPUT VALIDATION ───
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Messages must be a non-empty array"
      });
    }

    // ─── DETERMINE QUERY TYPE ───
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    const isStructuredQuery = /post|song|music|feed|latest|trending|discover/i.test(userMessage);

    // ─── FETCH APP CONTEXT ───
    const appContext = await getAppContext();

    // ─── SELECT SYSTEM PROMPT ───
    let systemPrompt = "";
    let responseSchema = "plain_text";
    let temperature = 0.7;

    if (isStructuredQuery) {
      systemPrompt = SYSTEM_PROMPTS.chatStructured
        .replace("{appContext}", appContext)
        .replace("{userQuery}", userMessage);
      responseSchema = "json_object";
      temperature = 0.1;  // High precision for JSON
    } else {
      systemPrompt = SYSTEM_PROMPTS.chatGeneral
        .replace("{appContext}", appContext);
      temperature = 0.7;  // Normal creativity
    }

    // ─── CALL AI ───
    const aiResponse = await aiService.chat(messages, {
      systemPrompt,
      temperature,
      maxTokens: 1024,
      responseSchema,
      strict: isStructuredQuery  // Strict parsing for structured queries
    });

    // ─── HANDLE RESPONSE ───
    if (isStructuredQuery) {
      if (aiResponse.parseSuccess && typeof aiResponse.content === "object") {
        return res.status(200).json({
          success: true,
          type: "structured",
          payload: aiResponse.content,
          model: aiResponse.model
        });
      } else {
        // Fallback for structured query failures
        return res.status(200).json({
          success: true,
          type: "text",
          content: "I found some content but couldn't format it perfectly. Try a more specific query!",
          model: aiResponse.model
        });
      }
    }

    // Normal text response
    res.status(200).json({
      success: true,
      type: "text",
      content: aiResponse.content,
      model: aiResponse.model
    });

  } catch (error) {
    console.error("[Chat-Error]", error);
    res.status(500).json({
      success: false,
      error: "Chat service temporarily unavailable",
      suggestion: "Try asking about specific songs or posts!"
    });
  }
};

/**
 * @route   GET /api/ai/stats
 * @desc    Get AI service statistics
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    const stats = aiService.getStats();
    res.status(200).json({
      success: true,
      data: {
        aiService: stats,
        features: aiConfig.features,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Format app context for AI consumption (improved)
 */
const formatContext = (posts, music) => {
  let context = "[CURRENT APP CONTEXT]\n\n";

  if (posts && posts.length > 0) {
    context += "=== RECENT POSTS ===\n";
    posts.slice(0, 3).forEach((p, i) => {
      const username = p.user?.username || "anonymous";
      const caption = p.caption.substring(0, 80).replace(/\n/g, " ");
      context += `${i + 1}. @${username}: "${caption}..."\n`;
    });
  } else {
    context += "[No recent posts]\n";
  }

  context += "\n=== TRENDING MUSIC ===\n";
  if (music && music.length > 0) {
    music.slice(0, 3).forEach((m, i) => {
      const artist = m.artist?.username || "Various";
      context += `${i + 1}. "${m.title}" by @${artist}\n`;
    });
  } else {
    context += "[No trending tracks]\n";
  }

  return context;
};

/**
 * Fetch and cache app context
 */
const getAppContext = async () => {
  const now = Date.now();
  if (cachedContext && now - lastFetchTime < CACHE_DURATION) {
    return cachedContext;
  }

  try {
    const [posts, music] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "username")
        .lean(),
      Music.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("artist", "username")
        .lean()
    ]);

    cachedContext = formatContext(posts, music);
    lastFetchTime = now;
    return cachedContext;

  } catch (err) {
    console.error("[Context-Fetch-Error]", err.message);
    return "[Unable to fetch live context]";
  }
};

/**
 * Export helper functions for testing
 */
exports.validateCaptionInput = validateCaptionInput;
exports.validateHashtagInput = validateHashtagInput;
exports.SYSTEM_PROMPTS = SYSTEM_PROMPTS;
