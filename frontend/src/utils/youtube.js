/**
 * YouTube URL utilities for consistent video ID extraction and URL formatting
 */

/**
 * Extract video ID from any YouTube URL format
 * Supports:
 * - https://www.youtube.com/watch?v=videoId
 * - https://youtu.be/videoId
 * - videoId (raw ID)
 *
 * @param {string} urlOrId - YouTube URL or video ID
 * @returns {string|null} - Extracted video ID or null if invalid
 */
export const extractVideoId = (urlOrId) => {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  // If it's already just a video ID (11 characters, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }

  // youtube.com/watch?v=videoId format
  const youtubeMatch = urlOrId.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (youtubeMatch?.[1]) {
    return youtubeMatch[1];
  }

  return null;
};

/**
 * Normalize any YouTube URL/ID to standard format
 * Always returns: https://www.youtube.com/watch?v=videoId
 *
 * @param {string} urlOrId - YouTube URL or video ID
 * @returns {string|null} - Standardized YouTube URL or null if invalid
 */
export const normalizeYoutubeUrl = (urlOrId) => {
  const videoId = extractVideoId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Validate YouTube URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
export const isValidYoutubeUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return extractVideoId(url) !== null;
};
