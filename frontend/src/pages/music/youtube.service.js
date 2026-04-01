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

  return (data.items || [])
    .filter((item) => item.id?.videoId || item.id?.playlistId)
    .map((item) => {
      const thumbnail =
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url;

      if (item.id?.playlistId) {
        return {
          _id: `playlist_${item.id.playlistId}`,
          title: item.snippet.title,
          artist: { username: item.snippet.channelTitle },
          thumbnail,
          playlistId: item.id.playlistId,
          isPlaylist: true,
        };
      }

      return {
        _id: item.id.videoId,
        title: item.snippet.title,
        artist: { username: item.snippet.channelTitle },
        thumbnail,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        isPlaylist: false,
      };
    });
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
  return (data.items || [])
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
};
