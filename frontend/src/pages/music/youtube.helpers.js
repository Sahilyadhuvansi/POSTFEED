import {
  HARD_EXCLUDE_KEYWORDS,
  MIN_TRACK_DURATION_SECONDS,
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

export const isLiveOrUpcoming = (liveBroadcastContent = "none") => {
  return liveBroadcastContent === "live" || liveBroadcastContent === "upcoming";
};

export const getMusicRelevanceScore = ({
  title = "",
  channelTitle = "",
  durationSeconds = 0,
  categoryId = "",
}) => {
  let score = 0;

  if (durationSeconds >= 150 && durationSeconds <= 420) score += 4;
  else if (durationSeconds >= MIN_TRACK_DURATION_SECONDS) score += 2;

  if (categoryId === "10") score += 4;

  const normalizedChannel = channelTitle.toLowerCase();
  if (
    PREFERRED_CHANNEL_HINTS.some((hint) => normalizedChannel.includes(hint))
  ) {
    score += 3;
  }

  if (hasKeyword(title, SOFT_QUALITY_PENALTY_KEYWORDS)) {
    score -= 3;
  }

  return score;
};
