import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useMusic } from "./MusicContext";
import { useAuth } from "../auth/AuthContext";
import {
  Play,
  Pause,
  Music as MusicIcon,
  Disc,
  Trash2,
  MoreVertical,
  Volume2,
} from "lucide-react";
import { API_URL } from "../../config";
import { MusicSkeleton } from "../../components/SkeletonLoader";
import { useApiCache } from "../../hooks/useApiCache";

const MUSIC_PER_PAGE = 15;

const Music = () => {
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { user } = useAuth();
  const { getFromCache, setCache } = useApiCache();
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
    // If we have cached data, don't trigger initial fetch
    if (initialCached) return;

    const fetchMusics = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/music?page=1&limit=${MUSIC_PER_PAGE}`,
        );
        const newMusics = response.data.musics || [];
        setMusics(newMusics);
        setPage(1);
        setHasMore(newMusics.length === MUSIC_PER_PAGE);
        setCache("music_tracks_page_1", { musics: newMusics, page: 1 });
      } catch (error) {
        console.error("Fetch Error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMusics();
  }, [getFromCache, setCache, initialCached]);

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

    axios
      .get(`${API_URL}/api/music?page=${nextPage}&limit=${MUSIC_PER_PAGE}`)
      .then((res) => {
        const newMusics = res.data.musics || [];
        setMusics((prev) => [...prev, ...newMusics]);
        setPage(nextPage);
        setHasMore(newMusics.length === MUSIC_PER_PAGE);
        setCache(cacheKey, { musics: newMusics });
      })
      .catch((err) => {
        console.error("Load more error:", err.message);
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
    if (!window.confirm("Are you sure you want to delete this track?")) return;

    try {
      await axios.delete(`${API_URL}/api/music/${musicId}`);
      setMusics((prev) => prev.filter((m) => m._id !== musicId));
      setActiveMenu(null);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete track.");
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
      <div className="min-h-screen bg-black pb-28">
        <div className="mx-auto max-w-[1400px] px-6 pt-12">
          <MusicSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="mx-auto max-w-[1400px] px-6 pt-12">
        {/* Header */}
        <div className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white italic tracking-tight">
              Sonic
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                Universe
              </span>
            </h1>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Discover pure audio expressions</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Library Size</p>
              <p className="text-xl font-black text-white">{musics.length}+ <span className="text-xs text-neutral-700">Tracks</span></p>
            </div>
          </div>
        </div>

        {musics.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center space-y-4">
               <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MusicIcon className="w-8 h-8 text-neutral-700" />
              </div>
              <p className="text-xl font-bold text-neutral-400">The floor is silent</p>
              <p className="text-sm text-neutral-600 font-medium">Be the one to start the noise</p>
            </div>
          </div>
        ) : (
          /* Music Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6">
            {musics.map((music) => (
              <div
                key={music._id}
                className={`group relative rounded-[24px] border transition-all duration-500 overflow-hidden ${
                  currentTrack?._id === music._id
                    ? "border-indigo-500/30 bg-indigo-500/5"
                    : "border-white/5 bg-neutral-900/40 hover:bg-neutral-900 hover:border-white/10"
                }`}
              >
                {/* Artwork Area */}
                <div 
                  className="relative aspect-square m-3 rounded-[18px] overflow-hidden bg-neutral-800 cursor-pointer"
                  onClick={() => handlePlay(music)}
                >
                  {music.thumbnailUrl || music.thumbnail ? (
                    <img
                      src={music.thumbnailUrl || music.thumbnail}
                      alt={music.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                      <MusicIcon className="w-10 h-10 text-neutral-700" />
                    </div>
                  )}

                  {/* Dynamic Play Overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${currentTrack?._id === music._id ? "bg-indigo-500/20 backdrop-blur-[2px] opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"}`}>
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transform group-hover:scale-110 transition-transform shadow-xl">
                      {currentTrack?._id === music._id && isPlaying ? (
                        <Pause className="w-6 h-6 text-white fill-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      )}
                    </div>
                  </div>
                  
                  {/* Now Playing Visualizer Indicator */}
                  {currentTrack?._id === music._id && isPlaying && (
                    <div className="absolute bottom-4 left-4 flex items-end gap-[2px] h-4">
                      <div className="w-1 bg-white animate-[bounce_0.6s_infinite]" />
                      <div className="w-1 bg-white animate-[bounce_0.8s_infinite]" />
                      <div className="w-1 bg-white animate-[bounce_0.5s_infinite]" />
                    </div>
                  )}
                </div>

                {/* Info Bar */}
                <div className="px-5 pb-5 pt-2 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                        {music.title}
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5 truncate flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> {music.artist?.username || "Electronic Mind"}
                      </p>
                    </div>

                    {user && String(user._id) === String(music.artist?._id) && (
                      <div className="relative music-menu-container">
                        <button
                          onClick={(e) => toggleMenu(e, music._id)}
                          className="p-1 text-neutral-600 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === music._id && (
                          <div className="absolute right-0 bottom-full mb-2 w-36 rounded-xl bg-neutral-800 border border-white/10 shadow-2xl p-1.5 z-10">
                            <button
                              onClick={(e) => handleDelete(e, music._id)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
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
                className="py-24 flex flex-col items-center gap-4 col-span-full"
              >
                <Disc className="w-12 h-12 text-neutral-800 animate-spin" />
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em]">Expanding Soundscape</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Music;
