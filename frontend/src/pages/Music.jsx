import { useState, useEffect, useRef, useCallback } from "react";
import { useMusic } from "../features/music/MusicContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import {
  Music as MusicIcon,
  ArrowLeft,
  Disc,
  Search,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import { MusicSkeleton } from "../components/SkeletonLoader";
import { GENRES } from "./music/constants";
import {
  searchYouTubeContent,
  fetchPlaylistTracks,
} from "./music/youtube.service";
import MusicCard from "./music/MusicCard";

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
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter">
              Sonic
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                Universe
              </span>
            </h1>
          </div>
          <div className="glass px-8 py-5 rounded-[32px] border-white/5 text-center min-w-[140px]">
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
              Items
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
            Search: &quot;{searchQuery}&quot;
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
              No results
            </h2>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest text-center">
              Try another search
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
              {tracks.map((track) => (
                <MusicCard
                  key={track._id}
                  track={track}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playTrack={playTrack}
                  playableTracks={playableTracks}
                  handleOpenPlaylist={handleOpenPlaylist}
                  savedByUrl={savedByUrl}
                  savingId={savingId}
                  toggleFavorite={toggleFavorite}
                />
              ))}
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
                  {bollywoodAlbums.map((track) => (
                    <MusicCard
                      key={track._id}
                      track={track}
                      currentTrack={currentTrack}
                      isPlaying={isPlaying}
                      playTrack={playTrack}
                      playableTracks={playableTracks}
                      handleOpenPlaylist={handleOpenPlaylist}
                      savedByUrl={savedByUrl}
                      savingId={savingId}
                      toggleFavorite={toggleFavorite}
                      forceAlbum
                      accent="pink"
                    />
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Music;
