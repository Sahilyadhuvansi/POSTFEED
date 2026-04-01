import {
  chunk,
  getMusicRelevanceScore,
  isHardExcluded,
  isLikelyShortForm,
  isLiveOrUpcoming,
  parseIso8601DurationToSeconds,
} from "./youtube.helpers";

const fetchVideoDetailsByIds = async (videoIds, apiKey, signal) => {
  if (!videoIds.length) return new Map();

  const map = new Map();
  const idChunks = chunk(videoIds, 50);

  for (const ids of idChunks) {
    const params = new URLSearchParams({
      part: "contentDetails,snippet",
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
        categoryId: item.snippet?.categoryId || "",
        liveBroadcastContent: item.snippet?.liveBroadcastContent || "none",
      });
    }
  }

  return map;
};

export const searchYouTubeContent = async (term, signal, options = {}) => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const {
    type = "video,playlist",
    maxResults = "30",
    order,
    videoCategoryId,
  } = options;

  if (!API_KEY) {
    throw new Error(
      "VITE_YOUTUBE_API_KEY is not set in your Vercel environment variables.",
    );
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: term,
    type,
    maxResults,
    key: API_KEY,
  });

  if (order) params.set("order", order);
  if (videoCategoryId) params.set("videoCategoryId", videoCategoryId);

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
  const items = (data.items || []).filter(
    (item) => item.id?.videoId || item.id?.playlistId,
  );

  const videoIds = items.map((item) => item.id?.videoId).filter(Boolean);

  const detailsMap = await fetchVideoDetailsByIds(videoIds, API_KEY, signal);

  const mappedPlaylists = items
    .filter((item) => item.id?.playlistId)
    .map((item) => {
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

  const mappedVideos = items
    .filter((item) => item.id?.videoId)
    .map((item) => {
      const details = detailsMap.get(item.id.videoId);
      if (!details) return null;

      const title = details.title || item.snippet?.title || "";

      if (isLikelyShortForm(title, details.durationSeconds)) return null;
      if (isHardExcluded(title)) return null;
      if (isLiveOrUpcoming(details.liveBroadcastContent)) return null;

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
        _score: getMusicRelevanceScore({
          title,
          channelTitle: details.channelTitle || item.snippet.channelTitle || "",
          durationSeconds: details.durationSeconds,
          categoryId: details.categoryId,
        }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...video }) => video);

  return [...mappedVideos, ...mappedPlaylists];
};

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
  const baseTracks = (data.items || [])
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
    }));

  const detailsMap = await fetchVideoDetailsByIds(
    baseTracks.map((track) => track._id),
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

    return true;
  });
};
