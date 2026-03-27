const Music = require("../features/music/music.model");
const User = require("../features/user/user.model");
const aiService = require("../common/services/ai.service");
const aiConfig = require("../common/config/ai.config");

/**
 * AI Music Recommendation Engine (Groq/OpenAI Hybrid)
 * Provides personalized music recommendations using collaborative and content-based filtering
 */
class MusicRecommendationService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = aiConfig.cache.ttl.recommendations * 1000;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(userId, options = {}) {
    // ─── Step 1: Cache Check ───
    const { limit = 10, mood = null, similarTo = null } = options;
    const cacheKey = `rec_${userId}_${limit}_${mood}_${similarTo}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    // ─── Step 2: History Analysis ───
    const userMusic = await Music.find({ userId }).limit(20);
    
    // Get tracks from other creators
    const allMusic = await Music.find({ 
      userId: { $ne: userId } 
    })
      .populate("userId", "username profilePicture")
      .limit(100)
      .sort({ plays: -1, likes: -1 });

    if (allMusic.length === 0) return [];

    // ─── Step 3: Weighted Scoring ───
    const scoredMusic = allMusic.map(music => {
      let score = 0;
      score += (music.plays || 0) * 0.1;
      score += (music.likes || 0) * 0.5;

      if (userMusic.length > 0) {
        const userGenres = userMusic.map(m => m.genre).filter(Boolean);
        if (userGenres.includes(music.genre)) score += 20;
      }

      if (mood && music.mood && music.mood.toLowerCase() === mood.toLowerCase()) {
        score += 30;
      }

      return { music, score };
    });

    // ─── Step 4: Final Selection and AI Explanation ───
    let recommendations = scoredMusic
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.music);

    if (aiConfig.features.aiRecommendations) {
      recommendations = await this._addAIExplanations(recommendations, userMusic);
    }

    this._setCache(cacheKey, recommendations);
    return recommendations;
  }

  /**
   * Add AI-generated explanations using chat completion
   */
  async _addAIExplanations(recommendations, userHistory) {
    if (recommendations.length === 0) return recommendations;

    try {
      const userFavorites = userHistory.slice(0, 5).map((m) => m.title).join(", ");
      const recTitles = recommendations.map((r, i) => `${i + 1}. ${r.title}`).join("\n");

      const systemPrompt = "You are a personalized music DJ.";
      const userPrompt = `A user likes these songs: ${userFavorites || "New listener"}. 
Recommend these tracks and generate a brief reason (5-8 words each) for each recommendation:
${recTitles}
Return ONLY as a JSON array of strings: ["reason1", "reason2", ...]`;

      const response = await aiService.chat(
        [{ role: "user", content: userPrompt }],
        { systemPrompt, temperature: 0.6, maxTokens: 500 }
      );

      const reasons = this._parseJSON(response.content);

      return recommendations.map((rec, i) => ({
        ...rec.toObject(),
        recommendationReason: Array.isArray(reasons) && reasons[i] 
          ? reasons[i] 
          : "Recommended for your vibe",
      }));
    } catch (error) {
      console.error("Explanation AI Error:", error.message);
      return recommendations.map(rec => ({ ...rec.toObject(), recommendationReason: "Recommended for you" }));
    }
  }

  /**
   * Find similar songs with fallback reason logic
   */
  async findSimilar(musicId, limit = 5) {
    const targetMusic = await Music.findById(musicId);
    if (!targetMusic) throw new Error("Music not found");

    const allMusic = await Music.find({ _id: { $ne: musicId } }).limit(50);

    const similarities = allMusic.map(music => {
      let score = 0;
      if (music.genre === targetMusic.genre) score += 40;
      if (music.mood === targetMusic.mood) score += 30;

      const targetWords = targetMusic.title.toLowerCase().split(' ');
      const musicWords = music.title.toLowerCase().split(' ');
      const commonWords = targetWords.filter(w => musicWords.includes(w));
      score += commonWords.length * 5;

      return { music, score };
    });

    const sorted = similarities.sort((a, b) => b.score - a.score).slice(0, limit);

    return sorted.map((s) => ({
      ...s.music.toObject(),
      similarityScore: s.score,
      reason: this._getSimilarityReason(s.score, targetMusic, s.music),
    }));
  }

  /**
   * Generate mood-based playlist (In-Memory Search)
   */
  async generateMoodPlaylist(mood, limit = 20) {
    const query = {
      $or: [
        { mood: new RegExp(mood, "i") },
        { title: new RegExp(mood, "i") },
        { genre: new RegExp(mood, "i") }
      ]
    };

    const music = await Music.find(query).limit(limit).sort({ plays: -1 });

    return {
      mood,
      description: `A ${mood} playlist curated by AI`,
      playlist: music,
    };
  }

  /**
   * Trends Discovery with AI Insights
   */
  async discoverTrending(options = {}) {
    const { period = "week", genre = null, limit = 15 } = options;
    const startDate = new Date();
    if (period === "day") startDate.setDate(startDate.getDate() - 1);
    else if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);

    const query = { createdAt: { $gte: startDate } };
    if (genre) query.genre = genre;

    const trending = await Music.find(query).sort({ plays: -1 }).limit(limit);

    let insights = "Popular selection this period.";
    if (trending.length > 0 && aiConfig.features.trendingInsights) {
      insights = await this._analyzeTrendsAI(trending);
    }

    return { period, trending, insights };
  }

  async _analyzeTrendsAI(trending) {
    try {
      const titles = trending.slice(0, 10).map((m) => m.title).join(", ");
      const prompt = `Analyze current trending music and identify common patterns: ${titles}. What is currently moving the listeners? Explain in 2 sentences.`;
      const response = await aiService.chat([{ role: "user", content: prompt }], { maxTokens: 300 });
      return response.content;
    } catch (e) {
      return "Strong momentum in current music selections.";
    }
  }

  _getSimilarityReason(score, target, music) {
    if (score >= 70) return `Vibe match with ${target.title}`;
    if (score >= 40) return `Same genre: ${music.genre}`;
    return "Similar energy";
  }

  _parseJSON(text) {
    if (!text) return [];
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      return [];
    }
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) return cached.data;
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

module.exports = new MusicRecommendationService();
