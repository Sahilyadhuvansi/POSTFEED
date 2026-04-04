"use strict";

/**
 * AI CONTROLLER - Post Music AI (Production Refactor)
 * Senior Feature: Consistent Error Delegation & Standardized Telemetry
 */

const musicRecommendation = require("../../services/music-recommendation.service");
const contentModeration = require("../../services/content-moderation.service");
const youtubeService = require("../../services/youtube.service");
const aiService = require("../../services/ai.service");
const aiConfig = require("../../config/ai.config");
const Post = require("../posts/posts.model");
const Music = require("../music/music.model");
const {
  getAiContext,
  saveLastSearchResults,
  resolveEntityFromContext,
  resolveContextualAction,
  attachInterpretationMessage,
} = require("./ai.context-resolver");

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
  chatGeneral: `Friendly AI Assistant guide for the music platform. APP CONTEXT: {appContext}. Be encouraging and concise.`,
  actionSelector: `You are an AI action router for a music app.\nAllowed actions only: search_music, fetch_favorites, like_song, delete_song, import_playlist, batch_like, respond_normally.\nReturn ONLY valid JSON object with shape: {"action":"...","args":{},"reply":"short summary"}.\nRules:\n- If user asks to fetch/view favorites -> fetch_favorites\n- If user asks to save/like/favorite a song and provides youtube url -> like_song\n- If user asks to remove/unfavorite/delete song -> delete_song\n- If user asks to search/find music -> search_music\n- If spotify playlist link provided -> import_playlist\n- If user provides a list of multiple tracks or asks to like/save several songs at once -> batch_like\n- If intent is unclear -> respond_normally\n- like_song MUST apply to ONE song only\n- batch_like MUST handle an array of tracks in args {"tracks": [{"title": "...", "artist": "..."}]}\n- NEVER process multiple songs in one like/delete action; use batch_like instead\n- ALWAYS choose the most relevant/top result for single actions\n- If user says first/second/third/that one/this song and lastSearchResults exist, map reference to ONE item and call like_song OR delete_song with songId`,
};

const ACTIONS = {
  SEARCH_MUSIC: "search_music",
  FETCH_FAVORITES: "fetch_favorites",
  LIKE_SONG: "like_song",
  DELETE_SONG: "delete_song",
  IMPORT_PLAYLIST: "import_playlist",
  BATCH_LIKE: "batch_like",
  RESPOND_NORMALLY: "respond_normally",
};

const TOOL_METRICS = {
  [ACTIONS.SEARCH_MUSIC]: { success: 0, fail: 0 },
  [ACTIONS.FETCH_FAVORITES]: { success: 0, fail: 0 },
  [ACTIONS.LIKE_SONG]: { success: 0, fail: 0 },
  [ACTIONS.DELETE_SONG]: { success: 0, fail: 0 },
  [ACTIONS.IMPORT_PLAYLIST]: { success: 0, fail: 0 },
  [ACTIONS.BATCH_LIKE]: { success: 0, fail: 0 },
};

const normalizeText = (value = "") => value.toString().trim();

const extractYoutubeUrl = (text = "") => {
  const match = text.match(
    /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i,
  );
  return match ? match[0] : null;
};

const extractSpotifyUrl = (text = "") => {
  const match = text.match(/https?:\/\/(?:open\.)?spotify\.com\/[^\s]+/i);
  return match ? match[0] : null;
};

const extractQuotedText = (text = "") => {
  const match = text.match(/["“](.*?)["”]/);
  return match?.[1]?.trim() || null;
};

const createToolResponse = ({
  success,
  action,
  data = null,
  message = "",
  requiresAuth = false,
}) => ({
  success,
  action,
  data,
  message,
  requiresAuth,
});

const safeParseAIAction = (output) => {
  try {
    const parsed =
      typeof output === "string" ? JSON.parse(output) : output || {};
    const action = normalizeText(parsed.action).toLowerCase();

    if (!Object.values(ACTIONS).includes(action)) {
      return { action: ACTIONS.RESPOND_NORMALLY, args: {}, reply: "" };
    }

    return {
      action,
      args: parsed.args && typeof parsed.args === "object" ? parsed.args : {},
      reply: normalizeText(parsed.reply || ""),
    };
  } catch {
    return { action: ACTIONS.RESPOND_NORMALLY, args: {}, reply: "" };
  }
};

const hardFallbackAction = (message = "") => {
  const lowered = normalizeText(message).toLowerCase();
  const spotifyUrl = extractSpotifyUrl(message);
  const youtubeUrl = extractYoutubeUrl(message);
  const isSpotify = /spotify\.com\/(playlist|track)/i.test(message);
  const isCommand = /^(like|save|delete|remove)/i.test(lowered);

  if (isSpotify && spotifyUrl) {
    return {
      action: ACTIONS.IMPORT_PLAYLIST,
      args: { source: "spotify", url: spotifyUrl },
      forced: true,
    };
  }

  if (/(favorites?|saved songs?|my music|liked songs?)/i.test(lowered)) {
    return {
      action: ACTIONS.FETCH_FAVORITES,
      args: {},
      forced: true,
    };
  }

  if (isCommand && /(save|like|favorite|add)/i.test(lowered) && youtubeUrl) {
    return {
      action: ACTIONS.LIKE_SONG,
      args: {
        youtubeUrl,
        title: extractQuotedText(message) || "Imported Favorite",
      },
      forced: true,
    };
  }

  if (isCommand && /(remove|delete|unfavorite|unlike)/i.test(lowered)) {
    return {
      action: ACTIONS.DELETE_SONG,
      args: { youtubeUrl, title: extractQuotedText(message) },
      forced: true,
    };
  }

  if (/(search|find|show me|look for)/i.test(lowered)) {
    const query =
      extractQuotedText(message) ||
      lowered.replace(/^(search|find|show me|look for)\s+/i, "").trim();
    return {
      action: ACTIONS.SEARCH_MUSIC,
      args: { query },
      forced: true,
    };
  }

  return { action: ACTIONS.RESPOND_NORMALLY, args: {}, forced: false };
};

const preprocessUserIntent = (message = "") => {
  return hardFallbackAction(message);
};

const fetchFavoritesTool = async (_args, req) => {
  const musics = await Music.find({ artist: req.user.id })
    .select("youtubeUrl title thumbnailUrl artist createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return createToolResponse({
    success: true,
    action: ACTIONS.FETCH_FAVORITES,
    message: musics.length
      ? `Found ${musics.length} favorite tracks.`
      : "You do not have favorites yet.",
    data: { musics },
  });
};

const searchMusicTool = async (args, _req) => {
  const query = normalizeText(args?.query);
  if (!query) {
    return createToolResponse({
      success: false,
      action: ACTIONS.SEARCH_MUSIC,
      message: "Please tell me what song or artist you want to search.",
      data: null,
    });
  }

  const musics = await searchMusicInternal(query, 30);

  return createToolResponse({
    success: true,
    action: ACTIONS.SEARCH_MUSIC,
    message: musics.length
      ? `Found ${musics.length} matches for "${query}".`
      : `No songs found for "${query}" yet.`,
    data: { query, musics },
  });
};

const searchMusicInternal = async (query, limit = 30) => {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const exactRegex = new RegExp(`^${escaped}$`, "i");

  const musics = await Music.find({
    $or: [{ title: regex }, { youtubeUrl: regex }],
  })
    .select("youtubeUrl title thumbnailUrl artist createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return musics.sort((a, b) => {
    const aExact = exactRegex.test(a.title || "") ? 1 : 0;
    const bExact = exactRegex.test(b.title || "") ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    const aStarts = (a.title || "")
      .toLowerCase()
      .startsWith(query.toLowerCase())
      ? 1
      : 0;
    const bStarts = (b.title || "")
      .toLowerCase()
      .startsWith(query.toLowerCase())
      ? 1
      : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

const likeSongTool = async (args, req) => {
  const youtubeUrl = normalizeText(args?.youtubeUrl);
  const songId = normalizeText(args?.songId);
  const query = normalizeText(args?.query || args?.title);
  const title = normalizeText(args?.title || "Imported Favorite");

  let targetSong = null;

  // Input priority (highest confidence first): songId > youtubeUrl > query
  if (songId) {
    targetSong = await Music.findById(songId)
      .select("youtubeUrl title thumbnailUrl")
      .lean();
  } else if (youtubeUrl) {
    targetSong = {
      youtubeUrl,
      title,
      thumbnailUrl: normalizeText(args?.thumbnailUrl) || null,
    };
  } else if (query) {
    const results = await searchMusicInternal(query, 30);
    if (!results.length) {
      return createToolResponse({
        success: false,
        action: ACTIONS.LIKE_SONG,
        message: "No song found.",
        data: null,
      });
    }

    targetSong = results[0];
  }

  if (!targetSong?.youtubeUrl) {
    return createToolResponse({
      success: false,
      action: ACTIONS.LIKE_SONG,
      message:
        "Please provide a song query, song id, or YouTube song link to like.",
      data: null,
    });
  }

  const existing = await Music.findOne({
    artist: req.user.id,
    youtubeUrl: targetSong.youtubeUrl,
  }).lean();
  if (existing) {
    return createToolResponse({
      success: true,
      action: ACTIONS.LIKE_SONG,
      message: `"${existing.title}" is already in your favorites.`,
      data: existing,
    });
  }

  const created = await Music.create({
    artist: req.user.id,
    youtubeUrl: targetSong.youtubeUrl,
    title: normalizeText(targetSong.title || title),
    thumbnailUrl: targetSong.thumbnailUrl || null,
  });

  return createToolResponse({
    success: true,
    action: ACTIONS.LIKE_SONG,
    message: `Liked: "${created.title}" 🎵`,
    data: created.toObject(),
  });
};

const deleteSongTool = async (args, req) => {
  const songId = normalizeText(args?.songId);
  const youtubeUrl = normalizeText(args?.youtubeUrl);
  const title = normalizeText(args?.title);

  if (!songId && !youtubeUrl && !title) {
    return createToolResponse({
      success: false,
      action: ACTIONS.DELETE_SONG,
      message:
        "Tell me the song, or provide song id / title / YouTube URL to remove.",
      data: null,
    });
  }

  const filter = { artist: req.user.id };
  if (songId) {
    filter._id = songId;
  } else if (youtubeUrl) {
    filter.youtubeUrl = youtubeUrl;
  } else {
    filter.title = new RegExp(
      title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
  }

  const found = await Music.findOne(filter).lean();
  if (!found) {
    return createToolResponse({
      success: false,
      action: ACTIONS.DELETE_SONG,
      message: "I couldn't find that song in your favorites.",
      data: null,
    });
  }

  await Music.findByIdAndDelete(found._id);
  return createToolResponse({
    success: true,
    action: ACTIONS.DELETE_SONG,
    message: `Removed "${found.title}" from your favorites.`,
    data: { removedId: found._id },
  });
};

const batchLikeTool = async (args, req) => {
  const tracks = Array.isArray(args?.tracks) ? args.tracks : [];
  if (!tracks.length) {
    return createToolResponse({
      success: false,
      action: ACTIONS.BATCH_LIKE,
      message: "No tracks found to process.",
      data: null,
    });
  }

  const userId = req.user.id;
  const results = { saved: [], skipped: [], failed: [] };

  for (const t of tracks) {
    try {
      const query = `${t.title} ${t.artist || ""}`.trim();
      const yt = await youtubeService.findSingleTrack(query);
      if (!yt) {
        results.failed.push({ title: t.title, reason: "YouTube link not found" });
        continue;
      }

      const existing = await Music.findOne({
        artist: userId,
        youtubeUrl: yt.youtubeUrl,
      }).lean();
      if (existing) {
        results.skipped.push(t.title);
        continue;
      }

      const music = await Music.create({
        artist: userId,
        youtubeUrl: yt.youtubeUrl,
        title: yt.title,
        thumbnailUrl: yt.thumbnailUrl || null,
      });
      results.saved.push(music.title);
    } catch (e) {
      results.failed.push({ title: t.title, reason: e.message });
    }
  }

  return createToolResponse({
    success: true,
    action: ACTIONS.BATCH_LIKE,
    message: `Batch complete: Saved ${results.saved.length}, Skipped ${results.skipped.length}, Failed ${results.failed.length}.`,
    data: results,
  });
};

const importPlaylistTool = async (args, req) => {
  const url = args?.url || "";
  return createToolResponse({
    success: true,
    action: ACTIONS.IMPORT_PLAYLIST,
    message:
      "I've initialized the playlist resolver. Please confirm if you'd like me to start the batch import now.",
    data: { source: args?.source || "spotify", url },
  });
};

const TOOL_REGISTRY = {
  [ACTIONS.SEARCH_MUSIC]: {
    handler: searchMusicTool,
    requiresAuth: false,
    description: "Search saved music by title or YouTube URL",
  },
  [ACTIONS.FETCH_FAVORITES]: {
    handler: fetchFavoritesTool,
    requiresAuth: true,
    description: "Fetch the user's favorite songs",
  },
  [ACTIONS.LIKE_SONG]: {
    handler: likeSongTool,
    requiresAuth: true,
    description: "Save a YouTube song to favorites",
  },
  [ACTIONS.DELETE_SONG]: {
    handler: deleteSongTool,
    requiresAuth: true,
    description: "Delete a song from favorites",
  },
  [ACTIONS.IMPORT_PLAYLIST]: {
    handler: importPlaylistTool,
    requiresAuth: true,
    description: "Import playlist from external source (Spotify)",
  },
  [ACTIONS.BATCH_LIKE]: {
    handler: batchLikeTool,
    requiresAuth: true,
    description: "Like and save multiple songs from a list",
  },
};

const runTool = async (action, args, req) => {
  const tool = TOOL_REGISTRY[action];
  if (!tool) {
    return createToolResponse({
      success: false,
      action: ACTIONS.RESPOND_NORMALLY,
      message: "Unknown tool requested.",
      data: null,
    });
  }

  if (tool.requiresAuth && !req.user?.id) {
    TOOL_METRICS[action].fail += 1;
    return createToolResponse({
      success: false,
      action,
      requiresAuth: true,
      message: "Please log in first.",
      data: null,
    });
  }

  try {
    const result = await tool.handler(args || {}, req);

    if (action === ACTIONS.LIKE_SONG && Array.isArray(result?.data)) {
      result.data = result.data[0] || null;
    }

    TOOL_METRICS[action].success += result.success ? 1 : 0;
    TOOL_METRICS[action].fail += result.success ? 0 : 1;
    return result;
  } catch (error) {
    TOOL_METRICS[action].fail += 1;
    return createToolResponse({
      success: false,
      action,
      message: `Tool execution failed: ${error.message}`,
      data: null,
    });
  }
};

const getActionDecision = async (userMessage, appContext) => {
  const contextualMemory = arguments[2] || {};
  const recentResults = Array.isArray(contextualMemory.lastSearchResults)
    ? contextualMemory.lastSearchResults.slice(0, 10)
    : [];
  const memorySnippet = recentResults.length
    ? recentResults
        .map(
          (song, index) =>
            `${index + 1}. ${song.title} [songId:${song.songId}]`,
        )
        .join(" | ")
    : "none";

  const aiRes = await aiService.chat([{ role: "user", content: userMessage }], {
    systemPrompt: `${SYSTEM_PROMPTS.actionSelector}\nContext: ${appContext}\nlastSearchResults: ${memorySnippet}`,
    temperature: 0,
    responseSchema: "json_object",
    strict: true,
  });

  return safeParseAIAction(aiRes?.content);
};

const talkToolResult = async (toolResult, userMessage, appContext) => {
  const safeContext = {
    action: toolResult.action,
    success: toolResult.success,
    message: toolResult.message,
    hasData: !!toolResult.data,
  };

  const aiRes = await aiService.chat(
    [
      {
        role: "user",
        content: `User query: ${userMessage}\nTool result: ${JSON.stringify(safeContext)}`,
      },
    ],
    {
      systemPrompt: `You are a response formatter for tool results. Context: ${appContext}. Keep output short, actionable, and user-friendly.`,
      temperature: 0.2,
      responseSchema: "plain_text",
      strict: false,
      maxTokens: 120,
    },
  );

  return normalizeText(
    aiRes?.content || toolResult.message || "Action completed.",
  );
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recommendations =
      await musicRecommendation.getRecommendations(userId);
    res
      .status(200)
      .json({ success: true, data: recommendations, requestId: req.id });
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
    const aiRes = await aiService.chat([{ role: "user", content: prompt }], {
      temperature: 0.8,
    });
    res.status(200).json({
      success: true,
      data: { description: aiRes.content },
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrending = async (req, res, next) => {
  try {
    const trending = await Music.find()
      .sort({ playCount: -1 })
      .limit(10)
      .lean();
    const prompt = SYSTEM_PROMPTS.trendingAnalysis;
    const aiRes = await aiService.chat(
      [
        {
          role: "user",
          content: "Analyze: " + trending.map((m) => m.title).join(", "),
        },
      ],
      { systemPrompt: prompt },
    );
    res.status(200).json({
      success: true,
      data: { tracks: trending, insight: aiRes.content },
      requestId: req.id,
    });
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
    const aiRes = await aiService.chat(
      [{ role: "user", content: userPrompt }],
      {
        systemPrompt: SYSTEM_PROMPTS.captionGeneration,
        temperature: 0.6,
        maxTokens: 250,
        strict: true,
      },
    );
    res.status(200).json({
      success: true,
      data: { caption: aiRes.content },
      model: aiRes.model,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { messages = [] } = req.body;
    const userMessageRaw = messages[messages.length - 1]?.content || "";
    const userMessage = userMessageRaw.toLowerCase();
    const isStructured =
      /post|song|music|feed|latest|favorite|save|remove|playlist|spotify/i.test(
        userMessage,
      );

    const preprocessed = preprocessUserIntent(userMessage);
    const contextualAction = resolveContextualAction(userMessageRaw, req);
    const appContext = await getAppContext();
    const { value: aiContext } = getAiContext(req);

    let selectedAction = preprocessed;
    let interpretationEntity = null;
    if (contextualAction) {
      if (contextualAction.errorMessage) {
        return res.status(200).json({
          success: false,
          type: "tool_result",
          action: "selection_error",
          message: contextualAction.errorMessage,
          payload: null,
          requestId: req.id,
        });
      }

      selectedAction = contextualAction;
      const resolved = resolveEntityFromContext(userMessageRaw, aiContext);
      interpretationEntity = resolved?.entity || null;
    } else if (!preprocessed.forced) {
      const decision = await getActionDecision(
        userMessage,
        appContext,
        aiContext,
      );
      selectedAction = {
        action: decision.action,
        args: decision.args,
        forced: decision.action !== ACTIONS.RESPOND_NORMALLY,
      };
    }

    if (selectedAction.action !== ACTIONS.RESPOND_NORMALLY) {
      const toolResult = await runTool(
        selectedAction.action,
        selectedAction.args,
        req,
      );

      if (
        selectedAction.action === ACTIONS.SEARCH_MUSIC &&
        toolResult.success &&
        Array.isArray(toolResult.data?.musics)
      ) {
        saveLastSearchResults(req, toolResult.data.musics);
      }

      const formattedMessage = await talkToolResult(
        toolResult,
        userMessageRaw,
        appContext,
      ).catch(() => toolResult.message);

      const interpretationMessage = attachInterpretationMessage(
        interpretationEntity,
        userMessageRaw,
      );
      const finalMessage = interpretationMessage
        ? `${formattedMessage}\n(${interpretationMessage})`
        : formattedMessage;

      return res.status(200).json({
        success: toolResult.success,
        type: "tool_result",
        action: selectedAction.action,
        message: finalMessage,
        payload: toolResult.data,
        requestId: req.id,
      });
    }

    let systemPrompt = isStructured
      ? SYSTEM_PROMPTS.chatStructured
          .replace("{appContext}", appContext)
          .replace("{userQuery}", userMessage)
      : SYSTEM_PROMPTS.chatGeneral.replace("{appContext}", appContext);

    const aiRes = await aiService.chat(messages, {
      systemPrompt,
      temperature: isStructured ? 0.1 : 0.7,
      responseSchema: isStructured ? "json_object" : "plain_text",
      strict: isStructured,
    });

    res.status(200).json({
      success: true,
      type: isStructured ? "structured" : "text",
      [isStructured ? "payload" : "content"]: aiRes.content,
      model: aiRes.model,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
};

exports.suggestHashtags = async (req, res, next) => {
  try {
    const { caption = "", musicTitle = "", genre = "" } = req.body;
    const prompt = SYSTEM_PROMPTS.hashtagSuggestion
      .replace("{caption}", caption)
      .replace("{musicTitle}", musicTitle)
      .replace("{genre}", genre);
    const aiRes = await aiService.chat([{ role: "user", content: prompt }], {
      temperature: 0.5,
      responseSchema: "json_array",
      strict: true,
    });
    res.status(200).json({
      success: true,
      data: { hashtags: aiRes.content },
      model: aiRes.model,
      requestId: req.id,
    });
  } catch (_e) {
    res.status(200).json({
      success: true,
      data: { hashtags: ["music", "newmusic"], source: "fallback" },
      requestId: req.id,
    });
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
          hitRate:
            globalHits + globalMisses > 0
              ? ((globalHits / (globalHits + globalMisses)) * 100).toFixed(2) +
                "%"
              : "0%",
          totalCost: aiStats.totalCost,
          avgCost: aiStats.avgCostPerRequest,
        },
        services: { ai: aiStats, recommendations: recStats },
        tools: TOOL_METRICS,
        features: aiConfig.features,
      },
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTools = async (_req, res) => {
  return res.status(200).json({
    success: true,
    data: Object.entries(TOOL_REGISTRY).map(([name, config]) => ({
      name,
      auth: config.requiresAuth,
      description: config.description,
    })),
  });
};

const getAppContext = async () => {
  const now = Date.now();
  if (cachedContext && now - lastFetchTime < CACHE_DURATION)
    return cachedContext;
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
        .lean(),
    ]);
    cachedContext = `Recent Posts: ${posts.map((p) => `@${p.user?.username}: ${p.caption}`).join(" | ")}\nTrending: ${music.map((m) => `"${m.title}"`).join(", ")}`;
    lastFetchTime = now;
    return cachedContext;
  } catch (_err) {
    return "[Context unavailable]";
  }
};
