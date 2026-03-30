// ─── Commit: AI Service Integration and Logic ───
// What this does: Orchestrates AI features like recommendations, captions, and chat.
// Why it exists: To provide intelligent, AI-driven experiences for the Post Music platform.
// How it works: Interfaces with internal services (musicRecommendation, aiService) to process user requests.
// Beginner note: The Controller is the "Brain" of the feature—it decides what happens when a user clicks a button.

"use strict";

const musicRecommendation = require("../../services/music-recommendation.service");
const contentModeration = require("../../services/content-moderation.service");
const aiService = require("../../services/ai.service");
const aiConfig = require("../../config/ai.config");
const Post = require("../posts/posts.model");
const Music = require("../music/music.model");

// ─── Commit: Context Caching ───
// What this does: Stores application data temporarily in memory.
// Why it exists: To avoid hitting the database on every single AI chat message.
// How it works: Checks if 'cachedContext' is recent (within CACHE_DURATION).

let cachedContext = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000;

// ─── Commit: AI System Prompts ───
// What this does: Defines the instructions (Personalities) for the AI models.
// Why it exists: Large Language Models (LLMs) need specific context to perform specialized tasks accurately.
// How it works: Strings of text that are passed to the AI as "system" messages.
// Interview insight: "Prompt Engineering" at the code level ensures consistent and formatted AI responses.

const SYSTEM_PROMPTS = {
  captionGeneration: `Artist branding expert. Generate Instagram caption. 150-200 chars. 1-2 emojis. No hashtags. Return text only.`,
  hashtagSuggestion: `Music marketing expert. Return ONLY a JSON array of 5-8 relevant lowercase hashtags.`,
  moodPlaylist: `AI DJ. Describe a {mood} mood in 1-2 sentences. Text only.`,
  trendingAnalysis: `Trends analyst. Summarize current tracks in 1 sentence. Text only.`,
  recommendationReasons: `Music taste expert. Provide brief (5-10 words) specific reasons for matches. Return JSON array.`,
  chatStructured: `PostFeed Data Controller. APP CONTEXT: {appContext}. Query: {userQuery}. Return ONLY valid JSON structured for posts/songs/empty. No explanation.`,
  chatGeneral: `Friendly AI Assistant guide for the music platform. APP CONTEXT: {appContext}. Be encouraging and concise.`
};

// ─── Commit: Music Recommendation Engine ───
// What this does: Fetches personalized music suggestions and similar tracks.
// Why it exists: Drives user discovery and spent time on the platform.

exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recommendations = await musicRecommendation.getRecommendations(userId);
    res.status(200).json({ success: true, data: recommendations, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

exports.findSimilar = async (req, res, next) => {
  try {
    const { musicId } = req.params;
    const similar = await musicRecommendation.findSimilarTracks(musicId);
    res.status(200).json({ success: true, data: similar, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

// ─── Commit: AI Mood and Trending Insights ───
// What this does: Uses AI to describe moods and analyze music trends.

exports.moodPlaylist = async (req, res, next) => {
  try {
    const { mood } = req.body;
    const prompt = SYSTEM_PROMPTS.moodPlaylist.replace("{mood}", mood);
    const aiRes = await aiService.chat([{ role: "user", content: prompt }], { temperature: 0.8 });
    res.status(200).json({ success: true, data: { description: aiRes.content }, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

exports.getTrending = async (req, res, next) => {
  try {
    const trending = await Music.find().sort({ playCount: -1 }).limit(10).lean();
    const prompt = SYSTEM_PROMPTS.trendingAnalysis;
    const aiRes = await aiService.chat([{ role: "user", content: "Analyze: " + trending.map(m => m.title).join(", ") }], { systemPrompt: prompt });
    res.status(200).json({ success: true, data: { tracks: trending, insight: aiRes.content }, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

// ─── Commit: AI Content Moderation ───
// What this does: Checks user-generated content for safety and compliance.
// why it exists: To maintain a healthy and safe community environment.

exports.moderateContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    const result = await contentModeration.moderate(content);
    res.status(200).json({ success: true, data: result, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

// ─── Commit: AI-Powered Caption Generation ───
// What this does: Uses AI to write social media captions for music posts.
// Why it exists: Saves users time and provides professional-sounding copy.

exports.generateCaption = async (req, res, next) => {
  try {
    const { context = "", mood = "", musicTitle = "" } = req.body;
    if (!aiConfig.features.captionGeneration) {
      throw new Error("Feature temporarily disabled");
    }
    const userPrompt = `Context: ${context}\nTrack: ${musicTitle}\nMood: ${mood}`;
    const aiRes = await aiService.chat([{ role: "user", content: userPrompt }], {
      systemPrompt: SYSTEM_PROMPTS.captionGeneration,
      temperature: 0.6,
      maxTokens: 250,
      strict: true
    });
    res.status(200).json({ success: true, data: { caption: aiRes.content }, model: aiRes.model, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

// ─── Commit: Universal AI Chat Interface ───
// What this does: Handles general questions and "Structured" data lookups via AI.
// Why it exists: Provides a natural language interface for users to interact with the app.
// How it works: Dynamically switches prompts based on whether the user asks for data (posts/songs) or just chats.
// Interview insight: Combining "Search" and "Chat" into one interface is a core pattern of "AI-Native" apps.

exports.chat = async (req, res, next) => {
  try {
    const { messages = [] } = req.body;
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    const isStructured = /post|song|music|feed|latest/i.test(userMessage);

    const appContext = await getAppContext();
    let systemPrompt = isStructured 
      ? SYSTEM_PROMPTS.chatStructured.replace("{appContext}", appContext).replace("{userQuery}", userMessage)
      : SYSTEM_PROMPTS.chatGeneral.replace("{appContext}", appContext);

    const aiRes = await aiService.chat(messages, {
      systemPrompt,
      temperature: isStructured ? 0.1 : 0.7,
      responseSchema: isStructured ? "json_object" : "plain_text",
      strict: isStructured
    });

    res.status(200).json({ 
      success: true, 
      type: isStructured ? "structured" : "text",
      [isStructured ? "payload" : "content"]: aiRes.content,
      model: aiRes.model,
      requestId: req.id
    });
  } catch (error) {
    next(error);
  }
};

// ─── Commit: AI Hashtag Suggestions ───
// What this does: Suggests relevant hashtags for music marketing.

exports.suggestHashtags = async (req, res, next) => {
  try {
    const { caption = "", musicTitle = "", genre = "" } = req.body;
    const prompt = SYSTEM_PROMPTS.hashtagSuggestion.replace("{caption}", caption).replace("{musicTitle}", musicTitle).replace("{genre}", genre);
    const aiRes = await aiService.chat([{ role: "user", content: prompt }], {
      temperature: 0.5,
      responseSchema: "json_array",
      strict: true
    });
    res.status(200).json({ success: true, data: { hashtags: aiRes.content }, model: aiRes.model, requestId: req.id });
  } catch (_e) {
    res.status(200).json({ success: true, data: { hashtags: ["music", "newmusic"], source: "fallback" }, requestId: req.id });
  }
};

// ─── Commit: AI Performance Stats ───
// What this does: Returns cache hit rates and cost analysis for AI features.

exports.getStats = async (req, res, next) => {
  try {
    const aiStats = aiService.getStats();
    const recStats = musicRecommendation.getStats();
    const globalHits = (aiStats.cache?.hits || 0) + (recStats.hits || 0);
    const globalMisses = (aiStats.cache?.misses || 0) + (recStats.misses || 0);

    res.status(200).json({ 
      success: true, 
      data: { 
        global: {
          hitRate: (globalHits + globalMisses) > 0 ? ((globalHits / (globalHits + globalMisses)) * 100).toFixed(2) + "%" : "0%",
          totalCost: aiStats.totalCost,
          avgCost: aiStats.avgCostPerRequest
        },
        services: { ai: aiStats, recommendations: recStats },
        features: aiConfig.features 
      },
      requestId: req.id
    });
  } catch (error) {
    next(error);
  }
};

// ─── Commit: Application Context Builder ───
// What this does: Aggregates recent posts and music into a single context string for the AI.
// Why it exists: To give the AI "Eyes" into what is currently happening on the platform.

const getAppContext = async () => {
  const now = Date.now();
  if (cachedContext && now - lastFetchTime < CACHE_DURATION) return cachedContext;
  try {
    const [posts, music] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).limit(5).populate("user", "username").lean(),
      Music.find().sort({ createdAt: -1 }).limit(5).populate("artist", "username").lean()
    ]);
    cachedContext = `Recent Posts: ${posts.map(p => `@${p.user?.username}: ${p.caption}`).join(" | ")}\nTrending: ${music.map(m => `"${m.title}"`).join(", ")}`;
    lastFetchTime = now;
    return cachedContext;
  } catch (_err) {
    return "[Context unavailable]";
  }
};
