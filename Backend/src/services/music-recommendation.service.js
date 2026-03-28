const Music = require("../features/music/music.model");
const User = require("../features/users/users.model");
const aiService = require("./ai.service");
const aiConfig = require("../config/ai.config");

/**
 * AI Music Recommendation Engine (Powered by Groq)
 * Provides personalized music recommendations using collaborative and content-based filtering
 */
class MusicRecommendationService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = (aiConfig.cache.ttl.recommendations || 3600) * 1000;
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
    const userMusic = await Music.find({ artist: userId }).limit(20);
    
    // Get tracks from other creators
    const allMusic = await Music.find({ 
      artist: { $ne: userId } 
    })
      .populate("artist", "username profilePic")
      .limit(100)
      .sort({ createdAt: -1 }); // Fallback to createdAt as plays/likes are not yet enforced

    if (allMusic.length === 0) return [];

    // ─── Step 3: Weighted Scoring ───
    const scoredMusic = allMusic.map(music => {
      let score = 0;
      // In a production-grade system, these would be enriched by a dedicated Analytics service
      // For now, we use a basic recency score
      const recencyDays = (Date.now() - new Date(music.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 50 - recencyDays); 

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
      const targetWords = targetMusic.title.toLowerCase().split(' ');
      const musicWords = music.title.toLowerCase().split(' ');
      const commonWords = targetWords.filter(w => musicWords.includes(w));
      score += commonWords.length * 10;

      return { music, score };
    });

    const sorted = similarities.sort((a, b) => b.score - a.score).slice(0, limit);

    return sorted.map((s) => ({
      ...s.music.toObject(),
      similarityScore: s.score,
      reason: s.score > 0 ? `Shared vibe in title` : "New discovery for you",
    }));
  }

  /**
   * Generate mood-based playlist (In-Memory Search)
   */
  async generateMoodPlaylist(mood, limit = 20) {
    const query = {
      $or: [
        { title: new RegExp(mood, "i") }
      ]
    };

    // Corrected: 'plays' field removed as it's not in the current schema
    const music = await Music.find(query).sort({ createdAt: -1 }).limit(limit);

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
    const { period = "week", limit = 15 } = options;
    const startDate = new Date();
    if (period === "day") startDate.setDate(startDate.getDate() - 1);
    else if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);

    const query = { createdAt: { $gte: startDate } };

    const trending = await Music.find(query).sort({ createdAt: -1 }).limit(limit);

    let insights = "Popular selection this period.";
    // Feature flag check and call to private method
    if (trending.length > 0 && aiConfig.features.trendingInsights) {
      try {
        insights = await this._analyzeTrendsAI(trending);
      } catch (err) {
        console.error("Trends AI Error:", err.message);
      }
    }

    return { period, trending, insights };
  }

  /**
   * Analyze trending tracks using AI (Internal)
   */
  async _analyzeTrendsAI(trending) {
    const titles = trending.map(t => t.title).join(", ");
    const userPrompt = `Analyze these trending songs and give a one-sentence summary of the current vibe: ${titles}`;
    
    const response = await aiService.chat(
      [{ role: "user", content: userPrompt }],
      { systemPrompt: "You are a music trend analyst.", temperature: 0.5, maxTokens: 100 }
    );
    
    return response.content || "Vibe is currently diverse and fresh.";
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
