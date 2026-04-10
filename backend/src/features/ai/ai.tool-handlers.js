"use strict";

const youtubeService = require("../../services/youtube.service");
const Music = require("../music/music.model");

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

const handlers = {
  [ACTIONS.FETCH_FAVORITES]: async (_args, req) => {
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
  },

  [ACTIONS.SEARCH_MUSIC]: async (args) => {
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
  },

  [ACTIONS.LIKE_SONG]: async (args, req) => {
    const youtubeUrl = normalizeText(args?.youtubeUrl);
    const songId = normalizeText(args?.songId);
    const query = normalizeText(args?.query || args?.title);
    const title = normalizeText(args?.title || "Imported Favorite");

    let targetSong = null;

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
        message: "Please provide a song query, song id, or YouTube song link to like.",
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
  },

  [ACTIONS.DELETE_SONG]: async (args, req) => {
    const songId = normalizeText(args?.songId);
    const youtubeUrl = normalizeText(args?.youtubeUrl);
    const title = normalizeText(args?.title);

    if (!songId && !youtubeUrl && !title) {
      return createToolResponse({
        success: false,
        action: ACTIONS.DELETE_SONG,
        message: "Tell me the song, or provide song id / title / YouTube URL to remove.",
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
  },

  [ACTIONS.BATCH_LIKE]: async (args, req) => {
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
  },

  [ACTIONS.IMPORT_PLAYLIST]: async (args, _req) => {
    const url = args?.url || "";
    return createToolResponse({
      success: true,
      action: ACTIONS.IMPORT_PLAYLIST,
      message: "I've initialized the playlist resolver. Please confirm if you'd like me to start the batch import now.",
      data: { source: args?.source || "spotify", url },
    });
  },
};

const TOOL_REGISTRY = {
  [ACTIONS.SEARCH_MUSIC]: {
    handler: handlers[ACTIONS.SEARCH_MUSIC],
    requiresAuth: false,
    description: "Search saved music by title or YouTube URL",
  },
  [ACTIONS.FETCH_FAVORITES]: {
    handler: handlers[ACTIONS.FETCH_FAVORITES],
    requiresAuth: true,
    description: "Fetch the user's favorite songs",
  },
  [ACTIONS.LIKE_SONG]: {
    handler: handlers[ACTIONS.LIKE_SONG],
    requiresAuth: true,
    description: "Save a YouTube song to favorites",
  },
  [ACTIONS.DELETE_SONG]: {
    handler: handlers[ACTIONS.DELETE_SONG],
    requiresAuth: true,
    description: "Delete a song from favorites",
  },
  [ACTIONS.IMPORT_PLAYLIST]: {
    handler: handlers[ACTIONS.IMPORT_PLAYLIST],
    requiresAuth: true,
    description: "Import playlist from external source (Spotify)",
  },
  [ACTIONS.BATCH_LIKE]: {
    handler: handlers[ACTIONS.BATCH_LIKE],
    requiresAuth: true,
    description: "Like and save multiple songs from a list",
  },
};

module.exports = {
  ACTIONS,
  TOOL_REGISTRY,
  searchMusicInternal,
  TOOL_METRICS,
  preprocessUserIntent,
  hardFallbackAction,
};


