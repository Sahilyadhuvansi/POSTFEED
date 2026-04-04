import {
  buildMusicSearchQuery,
  chunk,
  dedupeByKey,
  getMusicRelevanceScore,
  isHardExcluded,
  isLikelyShortForm,
  isLikelyMusicContent,
  isLiveOrUpcoming,
  parseIso8601DurationToSeconds,
  scoreVideo,
} from "./youtube.helpers";

export const fetchVideoDetailsByIds = async (videoIds, apiKey, signal) => {
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

export const fetchChannelStatsByIds = async (channelIds, apiKey, signal) => {
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

export const fetchYouTubeContentFresh = async (term, signal, options = {}) => {
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
