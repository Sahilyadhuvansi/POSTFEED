import { useEffect, useState, useRef, useCallback } from "react";
import { useMusic } from "../features/music/MusicContext";
import { useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../components/ui/Toast";
import {
  Play,
  Pause,
  Music as MusicIcon,
  Disc,
  Trash2,
  MoreVertical,
  Volume2,
  Sparkles,
  Zap,
} from "lucide-react";
import api from "../services/api";
import { MusicSkeleton } from "../components/SkeletonLoader";
import { useApiCache } from "../hooks/useApiCache";

const MUSIC_PER_PAGE = 15;

const Music = () => {
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { getFromCache, setCache } = useApiCache();
  const location = useLocation();
  const observerTarget = useRef(null);

  // --- COLD START / CACHE INIT ---
  const initialCached = getFromCache("music_tracks_page_1");

  const [musics, setMusics] = useState(initialCached?.musics || []);
  const [loading, setLoading] = useState(!initialCached);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialCached?.page || 1);
  const [activeMenu, setActiveMenu] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (initialCached) return;

    const fetchMusics = async () => {
      try {
        const response = await api.get(`/music?page=1&limit=${MUSIC_PER_PAGE}`);
        const newMusics = response.data.musics || [];
        setMusics(newMusics);
        setPage(1);
        setHasMore(newMusics.length === MUSIC_PER_PAGE);
        setCache("music_tracks_page_1", { musics: newMusics, page: 1 });
      } catch (error) {
        addToast(
          error.response?.data?.error ||
            "Audio uplink failed. Frequencies offline.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMusics();
  }, [getFromCache, setCache, initialCached, addToast]);

  // --- DEEP LINKING (AI Controller) ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const playId = params.get("play");
    const selectId = params.get("select");
    const targetId = playId || selectId;

    if (targetId && musics.length > 0) {
      const track = musics.find((m) => m._id === targetId);
      if (track) {
        if (playId) {
          playTrack(track, musics);
        } else {
          // Just scroll to it or highlight (handled by grid logic)
          document
            .getElementById(`music-${targetId}`)
            ?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [location.search, musics, playTrack]);

  const loadMoreMusic = useCallback(() => {
    const nextPage = page + 1;
    const cacheKey = `music_tracks_page_${nextPage}`;
    const cached = getFromCache(cacheKey);

    if (cached) {
      setMusics((prev) => [...prev, ...cached.musics]);
      setPage(nextPage);
      setHasMore(cached.musics.length === MUSIC_PER_PAGE);
      return;
    }

    api
      .get(`/music?page=${nextPage}&limit=${MUSIC_PER_PAGE}`)
      .then((res) => {
        const newMusics = res.data.musics || [];
        setMusics((prev) => [...prev, ...newMusics]);
        setPage(nextPage);
        setHasMore(newMusics.length === MUSIC_PER_PAGE);
        setCache(cacheKey, { musics: newMusics });
      })
      .catch((err) => {
        console.error("Signal expansion failed:", err.message);
      });
  }, [page, getFromCache, setCache]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreMusic();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMoreMusic]);

  const handlePlay = (music) => {
    playTrack(music, musics);
  };

  const handleDelete = async (e, musicId) => {
    e.stopPropagation();
    if (!window.confirm("Purge this track from the sonic universe?")) return;

    try {
      await api.delete(`/music/${musicId}`);
      setMusics((prev) => prev.filter((m) => m._id !== musicId));
      setActiveMenu(null);
      addToast("Track neutralized.", "success");
    } catch (error) {
      addToast(
        error.response?.data?.error || "Neutralization protocol failed.",
        "error",
      );
    }
  };

  const toggleMenu = (e, musicId) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === musicId ? null : musicId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest(".music-menu-container")) return;
      setActiveMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pb-28">
        <div className="mx-auto max-w-[1400px] px-6 pt-16">
          <MusicSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="mx-auto max-w-[1400px] px-6 pt-16">
        {/* Sonic Header */}
        <div className="mb-16 border-b border-white/5 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl glass border-white/10">
                <MusicIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
                Audio Nexus
              </p>
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter">
              Sonic
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                Universe
              </span>
            </h1>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] opacity-60">
              Architectural waveforms in real-time
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="glass px-8 py-5 rounded-[32px] border-white/5 text-center min-w-[140px]">
              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                Active Clusters
              </p>
              <p className="text-2xl font-black text-white">
                {musics.length}
                <span className="text-xs text-indigo-400 ml-1">+</span>
              </p>
            </div>
          </div>
        </div>

        {musics.length === 0 ? (
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
              Be the first to project your soundscape
            </p>
          </div>
        ) : (
          /* Frequency Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6">
            {musics.map((music) => (
              <div
                key={music._id}
                id={`music-${music._id}`}
                className={`group relative rounded-[40px] glass-dark border transition-all duration-700 overflow-hidden ${
                  currentTrack?._id === music._id
                    ? "border-indigo-500/40 bg-indigo-500/5 shadow-[0_32px_80px_rgba(79,70,229,0.15)] scale-[1.02]"
                    : "border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-2"
                }`}
              >
                {/* Artwork Area */}
                <div
                  className="relative aspect-square m-4 rounded-[32px] overflow-hidden bg-neutral-900 cursor-pointer shadow-2xl"
                  onClick={() => handlePlay(music)}
                >
                  {music.thumbnailUrl || music.thumbnail ? (
                    <img
                      src={music.thumbnailUrl || music.thumbnail}
                      alt={music.title}
                      className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-black">
                      <Zap className="w-12 h-12 text-neutral-800" />
                    </div>
                  )}

                  {/* Dynamic State Overlay */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${currentTrack?._id === music._id ? "bg-indigo-500/20 backdrop-blur-[4px] opacity-100" : "bg-black/60 opacity-0 group-hover:opacity-100"}`}
                  >
                    <div className="w-16 h-16 rounded-[24px] glass border-white/20 flex items-center justify-center shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-active:scale-95">
                      {currentTrack?._id === music._id && isPlaying ? (
                        <Pause className="w-7 h-7 text-white fill-white animate-pulse" />
                      ) : (
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Waveform Viz */}
                  {currentTrack?._id === music._id && isPlaying && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-6">
                      <div className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite]" />
                      <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite] delay-75" />
                      <div className="w-1 bg-white rounded-full animate-[bounce_0.5s_infinite] delay-150" />
                      <div className="w-1 bg-white rounded-full animate-[bounce_0.7s_infinite] delay-100" />
                    </div>
                  )}
                </div>

                {/* Descriptor Cluster */}
                <div className="px-7 pb-7 pt-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight italic">
                        {music.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 opacity-60">
                        <Volume2 className="w-3 h-3 text-neutral-500" />
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] truncate">
                          {music.artist?.username || "Unknown artist"}
                        </p>
                      </div>
                    </div>

                    {user && String(user._id) === String(music.artist?._id) && (
                      <div className="relative music-menu-container">
                        <button
                          onClick={(e) => toggleMenu(e, music._id)}
                          className="p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-neutral-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === music._id && (
                          <div className="absolute right-0 bottom-full mb-3 w-48 rounded-[24px] glass-dark border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] p-2 z-20 animate-fade-in-up">
                            <button
                              onClick={(e) => handleDelete(e, music._id)}
                              className="w-full flex items-center gap-4 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-400/5 rounded-[18px] transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                              Neutralize
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div
                ref={observerTarget}
                className="py-32 flex flex-col items-center gap-6 col-span-full"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-indigo-500 animate-spin-slow" />
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
                </div>
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.6em] animate-pulse">
                  Expanding Frequency
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Music;
