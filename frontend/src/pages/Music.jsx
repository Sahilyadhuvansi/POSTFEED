import { useState, useEffect, useRef, useCallback } from "react";
import { useMusic } from "../features/music/MusicContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import {
  Play,
  Pause,
  Music as MusicIcon,
  ListMusic,
  ArrowLeft,
  Disc,
  Volume2,
  Sparkles,
  Search,
  Zap,
  AlertCircle,
  Heart,
} from "lucide-react";
import api from "../services/api";
import { MusicSkeleton } from "../components/SkeletonLoader";

const GENRES = [
  { label: "Trending", term: "trending music hits 2024" },
  { label: "Bollywood", term: "bollywood songs 2024 new" },
  { label: "Pop", term: "pop hits songs" },
  { label: "Hip-Hop", term: "hip hop rap hits" },
  { label: "Electronic", term: "electronic dance music edm" },
  { label: "Rock", term: "rock hits songs" },
  { label: "Indie", term: "indie alternative music" },
  { label: "Jazz", term: "jazz music smooth" },
  { label: "R&B", term: "rnb soul hits" },
  { label: "Classical", term: "classical music relaxing" },
];

// Direct YouTube Data API v3 call — no backend, no cold start, no scraper
const searchYouTubeContent = async (term, signal, options = {}) => {
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
    // Quota exceeded — give a clear message
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

const fetchPlaylistTracks = async (playlist, signal) => {
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

const Music = () => {
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { addToast } = useToast();
  const location = useLocation();

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [playlistMeta, setPlaylistMeta] = useState(null);
  const [savedByUrl, setSavedByUrl] = useState({});
  const [bollywoodAlbums, setBollywoodAlbums] = useState([]);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const hydrateSavedMap = useCallback(async () => {
    try {
      const res = await api.get("/music/mine");
      const map = (res.data?.musics || []).reduce((acc, item) => {
        if (item.youtubeUrl) {
          acc[item.youtubeUrl] = { ...item, _id: item._id || item.id };
        }
        return acc;
      }, {});
      setSavedByUrl(map);
    } catch {
      // Silent fail for guests / auth issues
    }
  }, []);

  const toggleFavorite = async (track) => {
    if (!track?.youtubeUrl) return;
    setSavingId(track._id);
    try {
      const existing = savedByUrl[track.youtubeUrl];

      if (existing?._id) {
        await api.delete(`/music/${existing._id}`);
        setSavedByUrl((prev) => {
          const next = { ...prev };
          delete next[track.youtubeUrl];
          return next;
        });
        addToast("Removed from favorites", "info");
        return;
      }

      const res = await api.post("/music", {
        title: track.title,
        youtubeUrl: track.youtubeUrl,
        thumbnailUrl: track.thumbnail,
      });

      const saved = res.data?.music;
      if (saved?.youtubeUrl) {
        setSavedByUrl((prev) => ({
          ...prev,
          [saved.youtubeUrl]: { ...saved, _id: saved._id || saved.id },
        }));
      }

      addToast("Added to favorites", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to save track", "error");
    } finally {
      setSavingId(null);
    }
  };

  const runSearch = useCallback(
    async (term, options = {}) => {
      const { showBollywoodSections = false } = options;
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setTracks([]);
      setBollywoodAlbums([]);
      try {
        if (showBollywoodSections) {
          const [songs, albums] = await Promise.all([
            searchYouTubeContent(term, abortRef.current.signal, {
              type: "video",
              maxResults: "24",
            }),
            searchYouTubeContent(
              "bollywood full album playlist jukebox",
              abortRef.current.signal,
              {
                type: "playlist",
                maxResults: "12",
              },
            ),
          ]);

          setTracks(songs);
          setBollywoodAlbums(albums);

          if (songs.length === 0 && albums.length === 0) {
            addToast("No results found. Try a different search.", "info");
          }
        } else {
          const results = await searchYouTubeContent(
            term,
            abortRef.current.signal,
            options,
          );
          setTracks(results);
          if (results.length === 0) {
            addToast("No results found. Try a different search.", "info");
          }
        }

        setPlaylistMeta(null);
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        if (err.message === "quota") {
          addToast("YouTube daily quota reached. Try again tomorrow.", "error");
        } else if (err.message?.includes("VITE_YOUTUBE_API_KEY")) {
          setApiKeyMissing(true);
        } else {
          addToast("Search failed. Check your connection.", "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  // Load default genre on mount
  useEffect(() => {
    runSearch(GENRES[0].term, { type: "video", maxResults: "30" });
    hydrateSavedMap();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (isSearching) {
        setIsSearching(false);
        const activeLabel = GENRES[activeGenre]?.label;
        const isTrending = activeLabel === "Trending";
        const isBollywood = activeLabel === "Bollywood";

        if (isBollywood) {
          runSearch(GENRES[activeGenre].term, { showBollywoodSections: true });
        } else if (isTrending) {
          runSearch(GENRES[activeGenre].term, {
            type: "video",
            maxResults: "30",
          });
        } else {
          runSearch(GENRES[activeGenre].term);
        }
      }
      return;
    }
    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(searchQuery.trim());
    }, 500);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleGenreClick = (idx) => {
    setActiveGenre(idx);
    setSearchQuery("");
    setIsSearching(false);
    setPlaylistMeta(null);
    const label = GENRES[idx].label;
    if (label === "Bollywood") {
      runSearch(GENRES[idx].term, { showBollywoodSections: true });
      return;
    }
    if (label === "Trending") {
      runSearch(GENRES[idx].term, { type: "video", maxResults: "30" });
      return;
    }
    runSearch(GENRES[idx].term);
  };

  const handleOpenPlaylist = async (playlist) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const playlistTracks = await fetchPlaylistTracks(
        playlist,
        abortRef.current.signal,
      );
      setTracks(playlistTracks);
      setPlaylistMeta({
        title: playlist.title,
        artist: playlist.artist?.username,
      });
      if (!playlistTracks.length) {
        addToast("No playable tracks found in this album/playlist.", "info");
      }
    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError") return;
      if (err.message === "quota") {
        addToast("YouTube daily quota reached. Try again tomorrow.", "error");
      } else {
        addToast("Could not open album right now.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const playableTracks = tracks.filter((t) => !t.isPlaylist && t.youtubeUrl);
  const isBollywoodView =
    !isSearching && GENRES[activeGenre]?.label === "Bollywood" && !playlistMeta;
  const activeGenreLabel = GENRES[activeGenre]?.label || "Discover";

  const renderMusicCard = (track, options = {}) => {
    const { forceAlbum = false, accent = "indigo" } = options;
    const isActive = currentTrack?._id === track._id;
    const isAlbum = forceAlbum || !!track.isPlaylist;
    const isSaved = !!savedByUrl[track.youtubeUrl];

    const accentClass =
      accent === "pink"
        ? "group-hover:text-pink-400"
        : "group-hover:text-indigo-400";

    return (
      <article
        key={track._id}
        className={`group rounded-2xl border p-3 transition-all duration-300 ${
          isActive
            ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_18px_40px_rgba(79,70,229,0.22)]"
            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
        }`}
      >
        <button
          onClick={() => {
            if (isAlbum) {
              handleOpenPlaylist(track);
              return;
            }
            playTrack(track, playableTracks);
          }}
          className="relative w-full aspect-square overflow-hidden rounded-xl bg-neutral-900"
        >
          {track.thumbnail ? (
            <img
              src={track.thumbnail}
              alt={track.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-black">
              <Zap className="w-10 h-10 text-neutral-700" />
            </div>
          )}

          <span className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-black/70 border border-white/25 flex items-center justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            {isActive && isPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : isAlbum ? (
              <ListMusic className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-[1px]" />
            )}
          </span>
        </button>

        <div className="pt-3 px-1">
          <h3
            className={`text-sm font-bold text-white truncate transition-colors ${accentClass}`}
          >
            {track.title}
          </h3>
          <p className="mt-1 text-xs text-neutral-400 truncate">
            {isAlbum ? "Open album tracks" : track.artist?.username}
          </p>
        </div>

        {!isAlbum && (
          <div className="pt-3 px-1 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(track);
              }}
              disabled={savingId === track._id}
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all disabled:opacity-50 ${
                isSaved
                  ? "border-pink-500/50 bg-pink-500/20 text-pink-400"
                  : "border-white/15 bg-white/5 text-neutral-500 hover:text-indigo-300 hover:border-indigo-400/40"
              }`}
              title={isSaved ? "Remove from favorites" : "Add to favorites"}
            >
              {savingId === track._id ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart
                  className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`}
                />
              )}
            </button>
          </div>
        )}
      </article>
    );
  };

  // Deep link support
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const playId = params.get("play");
    if (playId && playableTracks.length > 0) {
      const track = playableTracks.find((t) => t._id === playId);
      if (track) playTrack(track, playableTracks);
    }
  }, [location.search, playableTracks, playTrack]);

  // API key missing — show setup instructions
  if (apiKeyMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg w-full glass rounded-[40px] border border-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
            YouTube API Key Required
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
            Add your free YouTube Data API v3 key to Vercel environment
            variables to enable full music search.
          </p>
          <div className="text-left space-y-3 text-xs font-mono text-neutral-500 glass-dark rounded-2xl p-5 border border-white/5">
            <p className="text-neutral-300 font-sans font-black uppercase tracking-widest text-[10px] mb-3">
              Setup (2 minutes, free)
            </p>
            <p>1. Go to console.cloud.google.com</p>
            <p>2. New project → Enable YouTube Data API v3</p>
            <p>3. APIs &amp; Services → Credentials → Create API Key</p>
            <p>4. Vercel → Project Settings → Environment Variables</p>
            <p className="text-indigo-400">
              5. Add: VITE_YOUTUBE_API_KEY = your_key
            </p>
            <p>6. Redeploy</p>
          </div>
          <p className="text-[10px] text-neutral-600 mt-4 uppercase tracking-widest">
            Free · 10,000 requests/day · No credit card
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="mx-auto max-w-[1400px] px-6 pt-16">
        {/* Header */}
        <div className="mb-10 border-b border-white/5 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl glass border-white/10">
                <MusicIcon className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
                YouTube · Full Length
              </p>
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter">
              Sonic
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                Universe
              </span>
            </h1>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] opacity-60">
              Bollywood · International · Indie · Everything
            </p>
          </div>
          <div className="glass px-8 py-5 rounded-[32px] border-white/5 text-center min-w-[140px]">
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
              Tracks Loaded
            </p>
            <p className="text-2xl font-black text-white">
              {tracks.length}
              <span className="text-xs text-indigo-400 ml-1">+</span>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-neutral-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Bollywood, pop, artist, song name…"
            className="w-full glass rounded-[24px] border border-white/5 bg-white/[0.03] pl-14 pr-6 py-5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-6 flex items-center text-neutral-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
            >
              Clear
            </button>
          )}
        </div>

        {/* Genre tabs */}
        {!isSearching && (
          <div className="flex gap-2 flex-wrap mb-10">
            {GENRES.map((g, idx) => (
              <button
                key={g.label}
                onClick={() => handleGenreClick(idx)}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeGenre === idx
                    ? "bg-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.4)]"
                    : "glass border border-white/5 text-neutral-500 hover:text-white hover:border-white/10"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-8">
            Results for &quot;{searchQuery}&quot;
          </p>
        )}

        {playlistMeta && (
          <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-white/5 glass px-5 py-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-black">
                Album / Playlist
              </p>
              <h3 className="text-sm text-white font-black truncate mt-1">
                {playlistMeta.title}
              </h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest truncate mt-1">
                {playlistMeta.artist}
              </p>
            </div>
            <button
              onClick={() => {
                setPlaylistMeta(null);
                runSearch(searchQuery.trim() || GENRES[activeGenre].term);
              }}
              className="px-4 py-2 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <MusicSkeleton />
        ) : tracks.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center p-12 glass rounded-[48px] border-white/5">
            <div className="relative mb-8">
              <div className="w-24 h-24 glass-dark rounded-full flex items-center justify-center animate-pulse">
                <Disc className="w-10 h-10 text-neutral-800" />
              </div>
              <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 italic">
              Silence detected
            </h2>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest text-center">
              Try a different search or genre
            </p>
          </div>
        ) : (
          <>
            {!playlistMeta && (
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {isSearching ? `Search · ${searchQuery}` : activeGenreLabel}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isBollywoodView
                      ? "Top songs first, then albums — Spotify-style discovery."
                      : "Handpicked full-length tracks and playable collections."}
                  </p>
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black">
                  {tracks.length} items
                </p>
              </div>
            )}

            {isBollywoodView && (
              <div className="mb-4">
                <h3 className="text-base font-black text-white">Top Songs</h3>
              </div>
            )}

            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {tracks.map((track) => renderMusicCard(track))}
            </section>

            {isBollywoodView && bollywoodAlbums.length > 0 && (
              <>
                <div className="mt-12 mb-4 flex items-end justify-between gap-4">
                  <h3 className="text-base font-black text-white">
                    Albums &amp; Playlists
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black">
                    {bollywoodAlbums.length} collections
                  </p>
                </div>

                <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {bollywoodAlbums.map((track) =>
                    renderMusicCard(track, {
                      forceAlbum: true,
                      accent: "pink",
                    }),
                  )}
                </section>
              </>
            )}

            <div className="col-span-full py-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-neutral-700" />
                <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.5em]">
                  Powered by YouTube · Full Length Tracks
                </p>
                <Sparkles className="w-4 h-4 text-neutral-700" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Music;
