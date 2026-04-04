"use strict";

// Lightweight per-session AI context memory (in-process)
const AI_CONTEXT_STORE = new Map();
const AI_CONTEXT_TTL_MS = 30 * 60 * 1000;

const LIKE_PATTERNS = /\b(like|save|favorite|add)\b/i;
const DELETE_PATTERNS = /\b(delete|remove|unlike|discard|unfavorite)\b/i;
const DEICTIC_ENTITY_PATTERNS = /\b(that one|this song|that song|this one)\b/i;

const normalizeText = (value = "") => value.toString().trim();

const getAiContextKey = (req) => {
  if (req.user?.id) return `user:${req.user.id}`;
  if (req.ip) return `ip:${req.ip}`;
  return "anon";
};

const getAiContext = (req) => {
  const key = getAiContextKey(req);
  const now = Date.now();
  const existing = AI_CONTEXT_STORE.get(key);

  if (!existing) {
    return { key, value: {} };
  }

  if (now - existing.updatedAt > AI_CONTEXT_TTL_MS) {
    AI_CONTEXT_STORE.delete(key);
    return { key, value: {} };
  }

  return { key, value: existing.value || {} };
};

const setAiContext = (req, patch) => {
  const { key, value } = getAiContext(req);
  AI_CONTEXT_STORE.set(key, {
    value: { ...value, ...patch },
    updatedAt: Date.now(),
  });
};

const saveLastSearchResults = (req, musics = []) => {
  const compactResults = musics.slice(0, 30).map((music) => ({
    songId: String(music._id || music.songId || ""),
    title: music.title || "Untitled",
    youtubeUrl: music.youtubeUrl || "",
  }));

  setAiContext(req, {
    lastSearchResults: compactResults,
    lastResolvedIndex: 0,
  });
};

const getOrdinalIndex = (message = "", resultCount = 0) => {
  const normalized = normalizeText(message).toLowerCase();
  const match = normalized.match(
    /\b(first|second|third|fourth|fifth|last|final|\d+)\b/i,
  );
  if (!match) return null;

  const token = match[1].toLowerCase();
  const map = {
    first: 0,
    second: 1,
    third: 2,
    fourth: 3,
    fifth: 4,
    last: resultCount > 0 ? resultCount - 1 : null,
    final: resultCount > 0 ? resultCount - 1 : null,
  };

  if (Object.prototype.hasOwnProperty.call(map, token)) {
    return map[token];
  }

  const numeric = Number.parseInt(token, 10);
  if (Number.isNaN(numeric) || numeric < 1) return null;
  return numeric - 1;
};

const resolveEntityFromContext = (message = "", aiContext = {}) => {
  const lastSearchResults = Array.isArray(aiContext.lastSearchResults)
    ? aiContext.lastSearchResults
    : [];
  if (!lastSearchResults.length) return null;

  const lowered = normalizeText(message).toLowerCase();
  const ordinalIndex = getOrdinalIndex(lowered, lastSearchResults.length);
  const hasDeicticReference = DEICTIC_ENTITY_PATTERNS.test(lowered);

  let targetIndex = ordinalIndex;
  if (targetIndex === null && hasDeicticReference) {
    targetIndex = Number.isInteger(aiContext.lastResolvedIndex)
      ? aiContext.lastResolvedIndex
      : 0;
  }

  if (!Number.isInteger(targetIndex) || targetIndex < 0) return null;

  if (targetIndex >= lastSearchResults.length) {
    return {
      entity: null,
      index: targetIndex,
      errorMessage: "That selection doesn’t exist. Try another number.",
    };
  }

  return {
    entity: lastSearchResults[targetIndex] || null,
    index: targetIndex,
    errorMessage: null,
  };
};

const resolveContextualAction = (message = "", req) => {
  const lowered = normalizeText(message).toLowerCase();
  const { value: aiContext } = getAiContext(req);
  const resolved = resolveEntityFromContext(lowered, aiContext);

  if (resolved?.errorMessage) {
    return {
      errorMessage: resolved.errorMessage,
      forced: true,
    };
  }

  if (!resolved?.entity?.songId) return null;

  const { entity, index } = resolved;

  if (LIKE_PATTERNS.test(lowered)) {
    setAiContext(req, { lastResolvedIndex: index });
    return {
      action: "like_song",
      args: { songId: entity.songId },
      forced: true,
    };
  }

  if (DELETE_PATTERNS.test(lowered)) {
    setAiContext(req, { lastResolvedIndex: index });
    return {
      action: "delete_song",
      args: { songId: entity.songId },
      forced: true,
    };
  }

  return null;
};

const attachInterpretationMessage = (entity, originalMessage = "") => {
  if (!entity?.title) return null;
  const raw = normalizeText(originalMessage);
  if (!raw) return null;
  return `Interpreted "${raw}" as: "${entity.title}"`;
};

module.exports = {
  getAiContext,
  saveLastSearchResults,
  resolveEntityFromContext,
  resolveContextualAction,
  attachInterpretationMessage,
};
