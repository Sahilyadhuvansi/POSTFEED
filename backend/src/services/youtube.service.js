"use strict";

const yts = require("yt-search");

const logger = require("../utils/logger");

/**
 * Find the most relevant YouTube video for a query (e.g., "Song Name - Artist")
 */
exports.findSingleTrack = async (query) => {
  try {
    const r = await yts(query);
    const video = r.videos[0];
    if (!video) return null;

    return {
      title: video.title,
      youtubeUrl: video.url,
      thumbnailUrl: video.thumbnail || video.image,
      duration: video.duration.seconds,
      views: video.views,
    };
  } catch (error) {
    logger.error("[YouTubeService] Search error:", error);
    return null;
  }
};

