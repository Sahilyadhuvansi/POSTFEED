import {
  BAD_KEYWORDS,
  HARD_EXCLUDE_KEYWORDS,
  MIN_TRACK_DURATION_SECONDS,
  MUSIC_INTENT_KEYWORDS,
  PREFERRED_CHANNEL_HINTS,
  SHORT_FORM_KEYWORDS,
  SOFT_QUALITY_PENALTY_KEYWORDS,
} from "./youtube.constants";

export const parseIso8601DurationToSeconds = (isoDuration = "") => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
};

export const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const hasKeyword = (title = "", keywords = []) => {
  const normalized = title.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

export const isLikelyShortForm = (title = "", durationSeconds = 0) => {
  const normalized = title.toLowerCase();
  const hasShortKeyword = SHORT_FORM_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );

  return durationSeconds < MIN_TRACK_DURATION_SECONDS || hasShortKeyword;
};

export const isHardExcluded = (title = "") => {
  return hasKeyword(title, HARD_EXCLUDE_KEYWORDS);
};

export const hasMusicIntent = (text = "") => {
  return hasKeyword(text, MUSIC_INTENT_KEYWORDS);
};

export const buildMusicSearchQuery = (term = "") => {
  const normalized = term.trim();
  if (!normalized) return normalized;
  if (hasMusicIntent(normalized)) return normalized;
  return `${normalized} song music official video lyrics audio`;
};

export const isLikelyMusicContent = ({
  title = "",
  channelTitle = "",
  categoryId = "",
}) => {
  if (categoryId === "10") return true;
  if (hasMusicIntent(title)) return true;
  if (hasMusicIntent(channelTitle)) return true;
  return false;
};

export const isLiveOrUpcoming = (liveBroadcastContent = "none") => {
  return liveBroadcastContent === "live" || liveBroadcastContent === "upcoming";
};

export const getMusicRelevanceScore = ({
  title = "",
  channelTitle = "",
  durationSeconds = 0,
  categoryId = "",
  viewCount = 0,
  subscriberCount = 0,
}) => {
  let score = 0;

  // duration preference: 3-8 min ideal
  if (durationSeconds >= 180 && durationSeconds <= 480) score += 5;
  else if (durationSeconds >= 150 && durationSeconds <= 540) score += 3;
  else if (durationSeconds >= MIN_TRACK_DURATION_SECONDS) score += 1;

  if (categoryId === "10") score += 4;
  if (hasMusicIntent(title)) score += 2;
  if (hasMusicIntent(channelTitle)) score += 1;

  const normalizedChannel = channelTitle.toLowerCase();
  if (
    PREFERRED_CHANNEL_HINTS.some((hint) => normalizedChannel.includes(hint))
  ) {
    score += 3;
  }

  // prefer high views
  if (viewCount >= 10_000_000) score += 4;
  else if (viewCount >= 1_000_000) score += 3;
  else if (viewCount >= 100_000) score += 2;
  else if (viewCount >= 10_000) score += 1;

  // channel trust proxy (verified-like preference)
  if (subscriberCount >= 1_000_000) score += 4;
  else if (subscriberCount >= 100_000) score += 2;
  else if (subscriberCount >= 10_000) score += 1;

  if (hasKeyword(title, BAD_KEYWORDS)) {
    score -= 5;
  }

  if (hasKeyword(title, SOFT_QUALITY_PENALTY_KEYWORDS)) {
    score -= 3;
  }

  return score;
};

export const scoreVideo = ({ title = "", channelTitle = "" }) => {
  const normalizedTitle = title.toLowerCase();
  const normalizedChannel = channelTitle.toLowerCase();

  let score = 0;

  if (PREFERRED_CHANNEL_HINTS.some((k) => normalizedChannel.includes(k))) {
    score += 3;
  }

  if (MUSIC_INTENT_KEYWORDS.some((k) => normalizedTitle.includes(k))) {
    score += 2;
  }

  if (BAD_KEYWORDS.some((k) => normalizedTitle.includes(k))) {
    score -= 5;
  }

  return score;
};
