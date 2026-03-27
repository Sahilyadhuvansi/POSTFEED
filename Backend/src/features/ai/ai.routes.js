const express = require("express");
const router = express.Router();
const aiController = require("./ai.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// ═══════════════════════════════════════════════════════════════
// Music Recommendation Routes
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get personalized music recommendations
 * @access  Private
 */
router.get("/recommendations", authMiddleware, aiController.getRecommendations);

/**
 * @route   GET /api/ai/similar/:musicId
 * @desc    Find similar songs
 * @access  Public
 */
router.get("/similar/:musicId", aiController.findSimilar);

/**
 * @route   POST /api/ai/mood-playlist
 * @desc    Generate mood-based playlist
 * @access  Public
 */
router.post("/mood-playlist", aiController.generateMoodPlaylist);

/**
 * @route   GET /api/ai/trending
 * @desc    Get trending music with AI insights
 * @access  Public
 */
router.get("/trending", aiController.getTrending);

// ═══════════════════════════════════════════════════════════════
// Content Moderation Routes
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/ai/moderate-content
 * @desc    Moderate text or image content
 * @access  Private
 */
router.post("/moderate-content", authMiddleware, aiController.moderateContent);

// ═══════════════════════════════════════════════════════════════
// Content Generation Routes
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/ai/generate-caption
 * @desc    Generate AI caption for post
 * @access  Private
 */
router.post("/generate-caption", authMiddleware, aiController.generateCaption);

/**
 * @route   POST /api/ai/suggest-hashtags
 * @desc    Suggest hashtags for post
 * @access  Private
 */
router.post("/suggest-hashtags", authMiddleware, aiController.suggestHashtags);

/**
 * @route   POST /api/ai/chat
 * @desc    General-purpose chat (Groq-powered, Floating Button)
 * @access  Public
 */
router.post("/chat", aiController.chat);

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/ai/stats
 * @desc    Get AI service statistics
 * @access  Private
 */
router.get("/stats", authMiddleware, aiController.getStats);

module.exports = router;
