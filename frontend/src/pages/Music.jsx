import { useState, useEffect, useRef, useCallback } from "react";
import { useMusic } from "../features/music/MusicContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import {
  Play,
  Pause,
  Music as MusicIcon,
  Disc,
  Volume2,
  Sparkles,
  Search,
  ExternalLink,
  Zap,
  AlertCircle,
} from "lucide-react";
import { MusicSkeleton } from "../components/SkeletonLoader";

const GENRES = [
  { label: "Trending",   term: "trending music hits 2024" },
  { label: "Bollywood",  term: "bollywood songs 2024 new" },
  { label: "Pop",        term: "pop hits songs" },
  { label: "Hip-Hop",    term: "hip hop rap hits" },
  { label: "Electronic", term: "electronic dance music edm" },
  { label: "Rock",       term: "rock hits songs" },
  { label: "Indie",      term: "indie alternative music" },
  { label: "Jazz",       term: "jazz music smooth" },
  { label: "R&B",        term: "rnb soul hits" },
  { label: "Classical",  term: "classical music relaxing" },
];

// Direct YouTube Data API v3 call — no backend, no cold start, no scraper
const searchYouTube = async (term, signal) => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  if (!API_KEY) {
    throw new Error("VITE_YOUTUBE_API_KEY is not set in your Vercel environment variables.");
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: term,
    type: "video",
    videoCategoryId: "10", // Music category only — no shorts, no vlogs
    maxResults: "30",
    key: API_KEY,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
    { signal }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Quota exceeded — give a clear message
    if (res.status === 403) throw new Error("quota");
    throw new Error(err?.error?.message || `YouTube API error ${res.status}`);
  }

  const data = await res.json();

  return (data.items || [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      _id: item.id.videoId,
      title: item.snippet.title,
      artist: { username: item.snippet.channelTitle },
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
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

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const runSearch = useCallback(async (term) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setTracks([]);
    try {
      const results = await searchYouTube(term, abortRef.current.signal);
      setTracks(results);
      if (results.length === 0) {
        addToast("No results found. Try a different search.", "info");
      }
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
  }, [addToast]);

  // Load default genre on mount
  useEffect(() => {
    runSearch(GENRES[0].term);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (isSearching) {
        setIsSearching(false);
        runSearch(GENRES[activeGenre].term);
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
    runSearch(GENRES[idx].term);
  };

  // Deep link support
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const playId = params.get("play");
    if (playId && tracks.length > 0) {
      const track = tracks.find((t) => t._id === playId);
      if (track) playTrack(track, tracks);
    }
  }, [location.search, tracks, playTrack]);

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
            Add your free YouTube Data API v3 key to Vercel environment variables to enable full music search.
          </p>
          <div className="text-left space-y-3 text-xs font-mono text-neutral-500 glass-dark rounded-2xl p-5 border border-white/5">
            <p className="text-neutral-300 font-sans font-black uppercase tracking-widest text-[10px] mb-3">Setup (2 minutes, free)</p>
            <p>1. Go to console.cloud.google.com</p>
            <p>2. New project → Enable YouTube Data API v3</p>
            <p>3. APIs &amp; Services → Credentials → Create API Key</p>
            <p>4. Vercel → Project Settings → Environment Variables</p>
            <p className="text-indigo-400">5. Add: VITE_YOUTUBE_API_KEY = your_key</p>
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

        {/* Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {tracks.map((track) => {
              const isActive = currentTrack?._id === track._id;
              return (
                <div
                  key={track._id}
                  className={`group relative rounded-[40px] glass-dark border transition-all duration-700 overflow-hidden ${
                    isActive
                      ? "border-indigo-500/40 bg-indigo-500/5 shadow-[0_32px_80px_rgba(79,70,229,0.15)] scale-[1.02]"
                      : "border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-2"
                  }`}
                >
                  {/* Artwork */}
                  <div
                    className="relative aspect-square m-4 rounded-[32px] overflow-hidden bg-neutral-900 cursor-pointer shadow-2xl"
                    onClick={() => playTrack(track, tracks)}
                  >
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-black">
                        <Zap className="w-12 h-12 text-neutral-800" />
                      </div>
                    )}

                    {/* Play overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? "bg-indigo-500/20 backdrop-blur-[4px] opacity-100"
                          : "bg-black/60 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-[24px] glass border-white/20 flex items-center justify-center shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-active:scale-95">
                        {isActive && isPlaying ? (
                          <Pause className="w-7 h-7 text-white fill-white animate-pulse" />
                        ) : (
                          <Play className="w-7 h-7 text-white fill-white ml-1" />
                        )}
                      </div>
                    </div>

                    {/* Waveform animation */}
                    {isActive && isPlaying && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-6">
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite]" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite] delay-75" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.5s_infinite] delay-150" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.7s_infinite] delay-100" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-7 pb-7 pt-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight italic">
                          {track.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 opacity-60">
                          <Volume2 className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] truncate">
                            {track.artist?.username}
                          </p>
                        </div>
                      </div>
                      {track.youtubeUrl && (
                        <a
                          href={track.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-neutral-600 hover:text-red-500 flex-shrink-0"
                          title="Watch on YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="col-span-full py-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-neutral-700" />
                <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.5em]">
                  Powered by YouTube · Full Length Tracks
                </p>
                <Sparkles className="w-4 h-4 text-neutral-700" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Music;
