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
} from "lucide-react";
import { MusicSkeleton } from "../components/SkeletonLoader";

const GENRES = [
  { label: "Trending", term: "top hits 2024" },
  { label: "Pop", term: "pop hits" },
  { label: "Hip-Hop", term: "hip hop rap" },
  { label: "Electronic", term: "electronic dance music" },
  { label: "Rock", term: "rock hits" },
  { label: "Indie", term: "indie alternative" },
  { label: "Jazz", term: "jazz chill" },
  { label: "R&B", term: "rnb soul" },
];

const normalizeTrack = (r) => ({
  _id: String(r.trackId),
  title: r.trackName,
  artist: { username: r.artistName },
  album: r.collectionName,
  audioUrl: r.previewUrl,
  thumbnail: r.artworkUrl100?.replace("100x100bb", "400x400bb"),
  appleMusicUrl: r.trackViewUrl,
  durationMs: r.trackTimeMillis,
});

const fetchFromItunes = async (term, signal) => {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=50`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  return (data.results || [])
    .filter((r) => r.previewUrl && r.trackId)
    .map(normalizeTrack);
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

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const loadGenre = useCallback(async (genreIndex) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setTracks([]);
    try {
      const results = await fetchFromItunes(
        GENRES[genreIndex].term,
        abortRef.current.signal
      );
      setTracks(results);
    } catch (err) {
      if (err.name !== "AbortError") {
        addToast("Audio uplink failed. Frequencies offline.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadGenre(0);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      loadGenre(activeGenre);
      return;
    }
    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setTracks([]);
      try {
        const results = await fetchFromItunes(
          searchQuery.trim(),
          abortRef.current.signal
        );
        setTracks(results);
        if (results.length === 0) {
          addToast("No tracks found. Try a different search.", "info");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          addToast("Search failed. Check your connection.", "error");
        }
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleGenreClick = (idx) => {
    setActiveGenre(idx);
    setSearchQuery("");
    setIsSearching(false);
    loadGenre(idx);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const playId = params.get("play");
    if (playId && tracks.length > 0) {
      const track = tracks.find((t) => t._id === playId);
      if (track) playTrack(track, tracks);
    }
  }, [location.search, tracks, playTrack]);

  return (
    <div className="min-h-screen pb-32">
      <div className="mx-auto max-w-[1400px] px-6 pt-16">

        {/* Header */}
        <div className="mb-10 border-b border-white/5 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl glass border-white/10">
                <MusicIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
                iTunes · 30s Previews
              </p>
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter">
              Sonic
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                Universe
              </span>
            </h1>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] opacity-60">
              100M+ tracks · no upload needed
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
            placeholder="Search any artist, song, or album…"
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

                    {isActive && isPlaying && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-6">
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite]" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite] delay-75" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.5s_infinite] delay-150" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.7s_infinite] delay-100" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-sm border border-white/10">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                        30s
                      </p>
                    </div>
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
                        {track.album && (
                          <p className="text-[9px] text-neutral-600 font-medium tracking-wide truncate mt-1 italic">
                            {track.album}
                          </p>
                        )}
                      </div>

                      {track.appleMusicUrl && (
                        <a
                          href={track.appleMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-neutral-600 hover:text-pink-400 flex-shrink-0"
                          title="Full track on Apple Music"
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
                  Powered by iTunes · 30-second previews
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
