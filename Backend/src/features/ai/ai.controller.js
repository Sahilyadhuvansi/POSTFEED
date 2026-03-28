const musicRecommendation = require("../../services/music-recommendation.service");
const contentModeration = require("../../services/content-moderation.service");
const aiService = require("../../services/ai.service");
const aiConfig = require("../../config/ai.config");

/**
 * AI Controller for POST_MUSIC (Professional AI Suite)
 * Handles music analysis, recommendations, and creative generation
 */

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get personalized music recommendations (Fast LPU Cache)
 * @access  Private
 */
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, mood = null } = req.query;

    const recommendations = await musicRecommendation.getRecommendations(userId, {
      limit: parseInt(limit),
      mood,
    });

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error("AI Recommendations Error:", error);
    res.status(500).json({ success: false, error: "AI recommendation engine is recovering. Try again shortly." });
  }
};

/**
 * @route   GET /api/ai/similar/:musicId
 * @desc    Find songs with similar "Musical Fingerprint"
 * @access  Public
 */
exports.findSimilar = async (req, res) => {
  try {
    const { musicId } = req.params;
    const { limit = 5 } = req.query;

    const similar = await musicRecommendation.findSimilar(musicId, parseInt(limit));

    res.status(200).json({
      success: true,
      count: similar.length,
      data: similar,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fingerprint track." });
  }
};

/**
 * @route   POST /api/ai/mood-playlist
 * @desc    Generate mood-based playlist (In-Memory Search)
 * @access  Public
 */
exports.generateMoodPlaylist = async (req, res) => {
  try {
    const { mood = "happy", limit = 20 } = req.body;
    const playlist = await musicRecommendation.generateMoodPlaylist(mood, parseInt(limit));
    res.status(200).json({ success: true, data: playlist });
  } catch (error) {
    res.status(500).json({ success: false, error: "Mood engine is resting. Try again soon." });
  }
};

/**
 * @route   GET /api/ai/trending
 * @desc    Trending music with AI Insights
 * @access  Public
 */
exports.getTrending = async (req, res) => {
  try {
    const { period = "week", genre = null, limit = 15 } = req.query;
    const trending = await musicRecommendation.discoverTrending({ period, genre, limit: parseInt(limit) });
    res.status(200).json({ success: true, data: trending });
  } catch (error) {
    res.status(500).json({ success: false, error: "Trends analysis failed." });
  }
};


/**
 * @route   POST /api/ai/generate-caption
 * @desc    Creative AI caption generation (Groq Priority)
 * @access  Private
 */
exports.generateCaption = async (req, res) => {
  try {
    const { context = "", mood = "", musicTitle = "" } = req.body;

    if (!aiConfig.features.captionGeneration) {
      return res.status(503).json({ success: false, error: "Caption generation is currently in maintenance." });
    }

    const systemPrompt = "You are a social media specialist for musicians.";
    const userPrompt = `Context: ${context || "New music drop"}\nTrack: ${musicTitle || "Vibe check"}\nMood: ${mood || "energetic"}\n\nGenerate a short (150 char), engaging caption with 1-2 emojis. Return ONLY text.`;

    const aiRes = await aiService.chat(
      [{ role: "user", content: userPrompt }],
      { systemPrompt, temperature: 0.8, maxTokens: 200 }
    );

    res.status(200).json({
      success: true,
      data: { caption: aiRes.content.trim() },
    });
  } catch (error) {
    console.error("AI Caption Error:", error);
    res.status(500).json({ success: false, error: "AI creative studio is busy. Please try again soon." });
  }
};

/**
 * @route   POST /api/ai/suggest-hashtags
 * @desc    Context-aware hashtag suggestion
 * @access  Private
 */
exports.suggestHashtags = async (req, res) => {
  try {
    const { caption = "", musicTitle = "", genre = "" } = req.body;

    const userPrompt = `Caption: ${caption}\nTrack: ${musicTitle}\nGenre: ${genre}\n\nSuggest 5-8 relevant hashtags. Return ONLY a JSON array like ["tag1", "tag2"].`;

    const aiRes = await aiService.chat(
      [{ role: "user", content: userPrompt }],
      { temperature: 0.7, maxTokens: 200 }
    );

    const text = aiRes.content.trim();
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    let hashtags = [];
    try {
      hashtags = JSON.parse(cleaned);
    } catch (e) {
      hashtags = ["music", "trending", genre || "artist"].filter(Boolean);
    }

    res.status(200).json({
      success: true,
      data: { hashtags },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Could not fetch suggestions." });
  }
};

/**
 * @route   POST /api/ai/moderate-content
 * @desc    Real-time content moderation (Safety Check)
 * @access  Private
 */
exports.moderateContent = async (req, res) => {
  try {
    const { text = null } = req.body;
    const userId = req.user.id;

    if (!aiConfig.features.contentModeration) return res.status(200).json({ success: true, warning: "Moderation disabled." });

    const moderation = await contentModeration.moderateContent({ text, userId });

    res.status(200).json({ success: true, data: moderation });
  } catch (error) {
    res.status(500).json({ success: false, error: "Safety filter failed." });
  }
};

/**
 * @route   POST /api/ai/chat
 * @desc    General-purpose chat interface (Groq-powered, Floating Button)
 * @access  Public
 */
exports.chat = async (req, res) => {
  try {
    const { messages = [], options = {} } = req.body;

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Messages array is required and must not be empty.",
      });
    }

    // Extract options with defaults
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 1024;

    // System prompt for general-purpose assistant
    const systemPrompt = "You are a helpful and friendly AI assistant. You provide clear, concise, and helpful responses. Keep your answers brief and engaging.";

    // Call Groq service (will fallback to OpenAI if Groq is unavailable)
    const aiResponse = await aiService.chat(messages, {
      systemPrompt,
      temperature,
      maxTokens,
    });

    res.status(200).json({
      success: true,
      content: aiResponse.content,
      model: aiResponse.model,
      usage: aiResponse.usage,
    });
  } catch (error) {
    console.error("AI Chat Production Error:", {
      message: error.message,
      stack: error.stack,
    });
    
    res.status(500).json({
      success: false,
      error: error.message?.includes("model") 
        ? "AI model is currently initializing. Please wait." 
        : "AI assistant is taking a short break. Try again in a moment.",
    });
  }
};

/**
 * @route   GET /api/ai/stats
 * @desc    Performance and economic tracking (Admin view)
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    const aiStats = aiService.getStats();
    res.status(200).json({
      success: true,
      data: {
        aiPerformance: aiStats,
        serviceStatus: aiConfig.features,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load telemetry." });
  }
};
