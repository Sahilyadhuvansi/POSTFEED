"use strict";

/**
 * AI CONTROLLER - Post Music AI (Production Refactor)
 * Senior Feature: Consistent Error Delegation & Standardized Telemetry
 */

const musicRecommendation = require("../../services/music-recommendation.service");
const contentModeration = require("../../services/content-moderation.service");
const aiService = require("../../services/ai.service");
const aiConfig = require("../../config/ai.config");
const Post = require("../posts/posts.model");
const Music = require("../music/music.model");

// Cache context (limit lookups)
let cachedContext = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000;

const SYSTEM_PROMPTS = {
  captionGeneration: `Artist branding expert. Generate Instagram caption. 150-200 chars. 1-2 emojis. No hashtags. Return text only.`,
  hashtagSuggestion: `Music marketing expert. Return ONLY a JSON array of 5-8 relevant lowercase hashtags.`,
  moodPlaylist: `AI DJ. Describe a {mood} mood in 1-2 sentences. Text only.`,
  trendingAnalysis: `Trends analyst. Summarize current tracks in 1 sentence. Text only.`,
  recommendationReasons: `Music taste expert. Provide brief (5-10 words) specific reasons for matches. Return JSON array.`,
  chatStructured: `PostFeed Data Controller. APP CONTEXT: {appContext}. Query: {userQuery}. Return ONLY valid JSON structured for posts/songs/empty. No explanation.`,
  chatGeneral: `Friendly AI Assistant guide for the music platform. APP CONTEXT: {appContext}. Be encouraging and concise.`
};

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

exports.moderateContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    const result = await contentModeration.moderate(content);
    res.status(200).json({ success: true, data: result, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

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
