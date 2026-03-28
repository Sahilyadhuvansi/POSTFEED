const musicRecommendation = require("../../services/music-recommendation.service");
const contentModeration = require("../../services/content-moderation.service");
const aiService = require("../../services/ai.service");
const aiConfig = require("../../config/ai.config");
const Post = require("../posts/posts.model");
const Music = require("../music/music.model");

// Performance optimization: 30-second context caching
let cachedContext = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000;

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
 * Helper: Format app context tight and clean for token efficiency
 */
const formatContext = (posts, music) => {
  let context = "[LIVE APP CONTEXT]\n\n";

  if (posts && posts.length > 0) {
    context += "Latest Posts:\n";
    posts.forEach((p, i) => {
      const username = p.user?.username || "anonymous";
      context += `${i + 1}. @${username}: ${p.caption.substring(0, 60)}${p.caption.length > 60 ? "..." : ""}\n`;
    });
  } else {
    context += "Latest Posts: No posts yet.\n";
  }

  context += "\nLatest Vibes:\n";
  if (music && music.length > 0) {
    music.forEach((m, i) => {
      context += `${i + 1}. ${m.title} – ${m.artist?.username || "Exclusive Artist"}\n`;
    });
  } else {
    context += "Latest Vibes: No trending music yet.\n";
  }

  return context;
};

/**
 * Fetch context with 30s caching layer
 */
const getAppContext = async () => {
  const now = Date.now();
  if (cachedContext && now - lastFetchTime < CACHE_DURATION) {
    return cachedContext;
  }

  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "username");

    const music = await Music.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("artist", "username");

    cachedContext = formatContext(posts, music);
    lastFetchTime = now;
    return cachedContext;
  } catch (err) {
    console.error("Context Fetch Error:", err);
    return "[LIVE APP CONTEXT] Latest Posts: No recent activity. Latest Vibes: No trending vibes.";
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

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: "Prompt is required." });
    }

    const userMessage = messages[messages.length - 1].content.toLowerCase();

    // 1. Intent Detection (Instant Shortcut Responses)
    if (userMessage.includes("latest post") || userMessage.includes("show feed")) {
      const posts = await Post.find().sort({ createdAt: -1 }).limit(3).populate("user", "username");
      if (posts.length > 0) {
        let resp = "Here are the latest posts on your feed:\n\n";
        posts.forEach((p, i) => {
          resp += `${i + 1}. @${p.user?.username || "user"}: "${p.caption}"\n`;
        });
        return res.status(200).json({ success: true, content: resp });
      }
      return res.status(200).json({ success: true, content: "The feed is currently quiet. Why not be the first to post something fresh? 🚀" });
    }

    if (userMessage.includes("latest vibes") || userMessage.includes("show music")) {
      const music = await Music.find().sort({ createdAt: -1 }).limit(5);
      if (music.length > 0) {
        let resp = "Here are the trending vibes on PostFeed:\n\n";
        music.forEach((m, i) => {
          resp += `${i + 1}. ${m.title} 🔥\n`;
        });
        return res.status(200).json({ success: true, content: resp });
      }
      return res.status(200).json({ success: true, content: "No vibes detected yet. Head over to VIBES to drop your first track! 🎧" });
    }

    // 2. Fetch Performance-Optimized Context
    const appContext = await getAppContext();

    // 3. Strict Persona System Prompt (Hard Instruction Pattern)
    const systemPrompt = `You are the official PostFeed In-App Assistant.
You MUST follow these rules strictly. If you break them, your response is invalid:
1. NEVER say "I cannot access real-time data" or "I am just an AI".
2. ALWAYS assume you have full access to PostFeed's internal database.
3. NEVER redirect users to external platforms (Twitter, Instagram, Reddit, etc.).
4. Stay helpful, concise, and deeply aligned with the PostFeed brand.
5. Use the [LIVE APP CONTEXT] below to answer specific questions about posts or music.
6. FALLBACK: If the LIVE APP CONTEXT is empty, simulate realistic mock content as if it exists in the app.

${appContext}`;

    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 1024;

    const aiResponse = await aiService.chat(messages, {
      systemPrompt,
      temperature,
      maxTokens,
    });

    res.status(200).json({
      success: true,
      content: aiResponse.content,
      model: aiResponse.model,
    });
  } catch (error) {
    console.error("AI Chat Production Error:", error);
    res.status(500).json({
      success: false,
      error: "AI assistant is taking a short break. Try again in a moment.",
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
