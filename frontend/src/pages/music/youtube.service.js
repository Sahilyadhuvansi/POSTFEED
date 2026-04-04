import {
  buildMusicSearchQuery,
  buildYouTubeCacheKey,
  chunk,
  dedupeByKey,
  getMusicRelevanceScore,
  getYouTubeSearchTtlMs,
  isHardExcluded,
  isLikelyShortForm,
  isLikelyMusicContent,
  isLiveOrUpcoming,
  parseIso8601DurationToSeconds,
  scoreVideo,
} from "./youtube.helpers";

const SEARCH_CACHE = new Map();
const PENDING_REFRESHES = new Map();
const SEARCH_METRICS = {
  hits: 0,
  staleHits: 0,
  misses: 0,
  refreshes: 0,
  fallbacks: 0,
  queryCounts: new Map(),
};
const STALE_WHILE_REVALIDATE_MS = 15 * 60 * 1000;

const isDev = import.meta.env.DEV;

const logMetric = (event, payload = {}) => {
  if (!isDev) return;
  console.info(`[YouTube] ${event}`, payload);
};

const cloneTrack = (track) => ({
  ...track,
  artist: track.artist ? { ...track.artist } : track.artist,
});

const cloneTracks = (tracks = []) => tracks.map(cloneTrack);

const recordQueryUsage = (cacheKey) => {
  const next = (SEARCH_METRICS.queryCounts.get(cacheKey) || 0) + 1;
  SEARCH_METRICS.queryCounts.set(cacheKey, next);
};

const getCacheEntryState = (entry, ttlMs) => {
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age <= ttlMs) {
    return { state: "fresh", data: entry.data };
  }

  if (age <= ttlMs + STALE_WHILE_REVALIDATE_MS) {
    return { state: "stale", data: entry.data };
  }

  return { state: "expired", data: entry.data };
};

const setCacheEntry = (cacheKey, data, ttlMs) => {
  SEARCH_CACHE.set(cacheKey, {
    data: cloneTracks(data),
    timestamp: Date.now(),
    ttlMs,
  });
};

const refreshSearchCache = async (term, options, cacheKey, signal) => {
  if (PENDING_REFRESHES.has(cacheKey)) return PENDING_REFRESHES.get(cacheKey);

  const refreshPromise = fetchYouTubeContentFresh(term, signal, options)
    .then((freshData) => {
      const ttlMs = getYouTubeSearchTtlMs(term, options);
      setCacheEntry(cacheKey, freshData, ttlMs);
      SEARCH_METRICS.refreshes += 1;
      logMetric("refresh", { query: cacheKey, count: freshData.length });
      return freshData;
    })
    .catch((error) => {
      logMetric("refresh_failed", { query: cacheKey, error: error.message });
      return null;
    })
    .finally(() => {
      PENDING_REFRESHES.delete(cacheKey);
    });

  PENDING_REFRESHES.set(cacheKey, refreshPromise);
  return refreshPromise;
};

const fetchVideoDetailsByIds = async (videoIds, apiKey, signal) => {
  if (!videoIds.length) return new Map();

  const map = new Map();
  const idChunks = chunk(videoIds, 50);

  for (const ids of idChunks) {
    const params = new URLSearchParams({
      part: "contentDetails,snippet,statistics",
      id: ids.join(","),
      maxResults: "50",
      key: apiKey,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`,
      { signal },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error("quota");
      throw new Error(err?.error?.message || `YouTube API error ${res.status}`);
    }

    const data = await res.json();
    for (const item of data.items || []) {
      map.set(item.id, {
        durationSeconds: parseIso8601DurationToSeconds(
          item.contentDetails?.duration,
        ),
        title: item.snippet?.title || "",
        channelTitle: item.snippet?.channelTitle || "",
        channelId: item.snippet?.channelId || "",
        categoryId: item.snippet?.categoryId || "",
        liveBroadcastContent: item.snippet?.liveBroadcastContent || "none",
        viewCount: Number(item.statistics?.viewCount || 0),
      });
    }
  }

  return map;
};

const fetchChannelStatsByIds = async (channelIds, apiKey, signal) => {
  if (!channelIds.length) return new Map();

  const map = new Map();
  const idChunks = chunk([...new Set(channelIds)], 50);

  for (const ids of idChunks) {
    const params = new URLSearchParams({
      part: "statistics,snippet",
      id: ids.join(","),
      maxResults: "50",
      key: apiKey,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params}`,
      { signal },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error("quota");
      throw new Error(err?.error?.message || `YouTube API error ${res.status}`);
    }

    const data = await res.json();
    for (const item of data.items || []) {
      map.set(item.id, {
        subscriberCount: Number(item.statistics?.subscriberCount || 0),
        channelTitle: item.snippet?.title || "",
      });
    }
  }

  return map;
};

const fetchYouTubeContentFresh = async (term, signal, options = {}) => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const {
    type = "video",
    maxResults = "30",
    order,
    videoCategoryId,
    strictMusicOnly = true,
    enhanceMusicQuery = true,
  } = options;

  if (!API_KEY) {
    throw new Error(
      "VITE_YOUTUBE_API_KEY is not set in your Vercel environment variables.",
    );
  }

  const effectiveQuery = enhanceMusicQuery ? buildMusicSearchQuery(term) : term;

  const params = new URLSearchParams({
    part: "snippet",
    q: effectiveQuery,
    type,
    maxResults,
    key: API_KEY,
  });

  if (order) params.set("order", order);
  if (videoCategoryId) {
    params.set("videoCategoryId", videoCategoryId);
  } else if (strictMusicOnly && type === "video") {
    params.set("videoCategoryId", "10");
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
    { signal },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 403) throw new Error("quota");
    throw new Error(err?.error?.message || `YouTube API error ${res.status}`);
  }

  const data = await res.json();
  const items = dedupeByKey(
    (data.items || []).filter(
      (item) => item.id?.videoId || item.id?.playlistId,
    ),
    (item) =>
      item.id?.videoId
        ? `video:${item.id.videoId}`
        : `playlist:${item.id.playlistId}`,
  );

  const videoIds = items.map((item) => item.id?.videoId).filter(Boolean);

  const detailsMap = await fetchVideoDetailsByIds(videoIds, API_KEY, signal);
  const channelStatsMap = await fetchChannelStatsByIds(
    [
      ...new Set(
        [...detailsMap.values()].map((d) => d.channelId).filter(Boolean),
      ),
    ],
    API_KEY,
    signal,
  );

  const mappedPlaylists = dedupeByKey(
    items.filter((item) => item.id?.playlistId),
    (item) => item.id.playlistId,
  ).map((item) => {
    const thumbnail =
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url;

    return {
      _id: `playlist_${item.id.playlistId}`,
      title: item.snippet.title,
      artist: { username: item.snippet.channelTitle },
      thumbnail,
      playlistId: item.id.playlistId,
      isPlaylist: true,
    };
  });

  const mappedVideos = dedupeByKey(
    items.filter((item) => item.id?.videoId),
    (item) => item.id.videoId,
  )
    .map((item) => {
      const details = detailsMap.get(item.id.videoId);
      if (!details) return null;

      const title = details.title || item.snippet?.title || "";
      const channelStats = channelStatsMap.get(details.channelId) || {
        subscriberCount: 0,
      };

      if (isLikelyShortForm(title, details.durationSeconds)) return null;
      if (isHardExcluded(title)) return null;
      if (isLiveOrUpcoming(details.liveBroadcastContent)) return null;
      if (
        strictMusicOnly &&
        !isLikelyMusicContent({
          title,
          channelTitle: details.channelTitle || item.snippet.channelTitle || "",
          categoryId: details.categoryId,
        })
      ) {
        return null;
      }

      const thumbnail =
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url;

      return {
        _id: item.id.videoId,
        title: item.snippet.title,
        artist: { username: item.snippet.channelTitle },
        thumbnail,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        isPlaylist: false,
        _score:
          getMusicRelevanceScore({
            title,
            channelTitle:
              details.channelTitle || item.snippet.channelTitle || "",
            durationSeconds: details.durationSeconds,
            categoryId: details.categoryId,
            viewCount: details.viewCount,
            subscriberCount: channelStats.subscriberCount,
          }) +
          scoreVideo({
            title,
            channelTitle:
              details.channelTitle || item.snippet.channelTitle || "",
          }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...video }) => video);

  return [...mappedVideos, ...mappedPlaylists];
};

export const searchYouTubeContent = async (term, signal, options = {}) => {
  const cacheKey = buildYouTubeCacheKey(term, options);
  const ttlMs = getYouTubeSearchTtlMs(term, options);
  recordQueryUsage(cacheKey);

  const cachedEntry = SEARCH_CACHE.get(cacheKey);
  const cachedState = getCacheEntryState(cachedEntry, ttlMs);

  if (cachedState?.state === "fresh") {
    SEARCH_METRICS.hits += 1;
    logMetric("cache_hit", {
      query: cacheKey,
      fresh: true,
      count: cachedState.data.length,
    });
    return cloneTracks(cachedState.data);
  }

  if (cachedState?.state === "stale") {
    SEARCH_METRICS.staleHits += 1;
    logMetric("cache_hit", {
      query: cacheKey,
      fresh: false,
      count: cachedState.data.length,
    });
    void refreshSearchCache(term, options, cacheKey, undefined);
    return cloneTracks(cachedState.data);
  }

  SEARCH_METRICS.misses += 1;

  try {
    const freshResults = await fetchYouTubeContentFresh(term, signal, options);
    setCacheEntry(cacheKey, freshResults, ttlMs);
    logMetric("cache_miss", { query: cacheKey, count: freshResults.length });
    return freshResults;
  } catch (error) {
    if (cachedEntry?.data?.length) {
      SEARCH_METRICS.fallbacks += 1;
      logMetric("fallback", { query: cacheKey, error: error.message });
      return cloneTracks(cachedEntry.data);
    }

    throw error;
  }
};

export const prefetchYouTubeSearches = async (terms = [], options = {}) => {
  const uniqueTerms = [
    ...new Set(terms.map((term) => term.trim()).filter(Boolean)),
  ];

  return Promise.allSettled(
    uniqueTerms.map((term) => searchYouTubeContent(term, undefined, options)),
  );
};

export const getYouTubeSearchMetrics = () => ({
  hits: SEARCH_METRICS.hits,
  staleHits: SEARCH_METRICS.staleHits,
  misses: SEARCH_METRICS.misses,
  refreshes: SEARCH_METRICS.refreshes,
  fallbacks: SEARCH_METRICS.fallbacks,
  queryCounts: Array.from(SEARCH_METRICS.queryCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  ),
});

export const fetchPlaylistTracks = async (playlist, signal) => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: playlist.playlistId,
    maxResults: "50",
    key: API_KEY,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
    { signal },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 403) throw new Error("quota");
    throw new Error(err?.error?.message || `YouTube API error ${res.status}`);
  }

  const data = await res.json();
  const baseTracks = dedupeByKey(
    (data.items || [])
      .filter((item) => item.contentDetails?.videoId && item.snippet?.title)
      .filter((item) => item.snippet.title.toLowerCase() !== "deleted video")
      .map((item) => ({
        _id: item.contentDetails.videoId,
        title: item.snippet.title,
        artist: {
          username:
            item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
        },
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
        isPlaylist: false,
      })),
    (item) => item._id,
  );

  const detailsMap = await fetchVideoDetailsByIds(
    baseTracks.map((track) => track._id),
    API_KEY,
    signal,
  );
  const channelStatsMap = await fetchChannelStatsByIds(
    [
      ...new Set(
        [...detailsMap.values()].map((d) => d.channelId).filter(Boolean),
      ),
    ],
    API_KEY,
    signal,
  );

  return baseTracks.filter((track) => {
    const details = detailsMap.get(track._id);
    if (!details) return false;

    const title = details.title || track.title;
    if (isLikelyShortForm(title, details.durationSeconds)) return false;
    if (isHardExcluded(title)) return false;
    if (isLiveOrUpcoming(details.liveBroadcastContent)) return false;
    if (
      !isLikelyMusicContent({
        title,
        channelTitle: details.channelTitle || "",
        categoryId: details.categoryId,
      })
    ) {
      return false;
    }

    const channelStats = channelStatsMap.get(details.channelId) || {
      subscriberCount: 0,
    };

    const rankScore =
      getMusicRelevanceScore({
        title,
        channelTitle: details.channelTitle || "",
        durationSeconds: details.durationSeconds,
        categoryId: details.categoryId,
        viewCount: details.viewCount,
        subscriberCount: channelStats.subscriberCount,
      }) + scoreVideo({ title, channelTitle: details.channelTitle || "" });

    if (rankScore < 1) return false;

    return true;
  });
};
