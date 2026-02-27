import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useMusic } from "../context/MusicContext";
import { useAuth } from "../context/AuthContext";
import {
  Play,
  Pause,
  Music as MusicIcon,
  Disc,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { API_URL } from "../config";
import { MusicSkeleton } from "../components/SkeletonLoader";
import { useApiCache } from "../hooks/useApiCache";

const Music = () => {
  const [musics, setMusics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null); // For the 3-dot menu
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { user } = useAuth();

  const MUSIC_PER_PAGE = 15;
  const { getFromCache, setCache } = useApiCache();
  const observerTarget = useRef(null);

  // --- DATA FETCHING ---
  // Initial load
  useEffect(() => {
    const cacheKey = "music_tracks_page_1";
    const cached = getFromCache(cacheKey);

    if (cached) {
      setMusics(cached.musics);
      setPage(cached.page);
      setLoading(false);
      return;
    }

    const fetchMusics = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/music?page=1&limit=${MUSIC_PER_PAGE}`,
        );
        const newMusics = response.data.musics || [];
        setMusics(newMusics);
        setPage(1);
        setHasMore(newMusics.length === MUSIC_PER_PAGE);
        setCache(cacheKey, { musics: newMusics, page: 1 });
      } catch (error) {
        console.error(
          "Failed to fetch musics:",
          error.response?.data?.error || error.message,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMusics();
  }, [getFromCache, setCache]);

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

  // Infinite scroll
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

  // --- UI HANDLERS ---
  const handlePlay = (music) => {
    // When a track is played, the entire current list of musics becomes the playlist
    playTrack(music, musics);
  };

  const handleDelete = async (e, musicId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this track?")) return;

    console.log("handleDelete invoked for musicId:", musicId);
    try {
      await axios.delete(`${API_URL}/api/music/${musicId}`);
      console.log("delete request sent for:", musicId);
      setMusics((prev) => prev.filter((m) => m._id !== musicId));
      setActiveMenu(null); // Close menu after delete
    } catch (error) {
      console.error("Delete music error (frontend):", error);
      const message =
        error.response?.status === 401
          ? "You are not logged in."
          : error.response?.status === 403
            ? "You don't have permission to delete this track."
            : error.response?.data?.error || "Failed to delete track.";
      alert(message);
    }
  };

  const toggleMenu = (e, musicId) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    setActiveMenu(activeMenu === musicId ? null : musicId);
  };

  // Close menu when clicking outside any music menu container
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click happened inside a menu container, do nothing
      if (event.target.closest(".music-menu-container")) return;
      setActiveMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black pb-28">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-5 lg:px-6 pt-6 pb-4">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Explore{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                Music
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Discover new tracks from trending artists
            </p>
          </div>
          <MusicSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5 lg:px-6 pt-6 pb-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Explore{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              Music
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Discover new tracks from trending artists
          </p>
        </div>

        {musics.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center space-y-3">
              <MusicIcon className="w-12 h-12 mx-auto text-gray-600" />
              <p className="text-gray-400 font-semibold">No tracks yet</p>
              <p className="text-xs text-gray-600">
                Be the first to upload music
              </p>
            </div>
          </div>
        ) : (
          /* Music Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {musics.map((music) => (
              <div
                key={music._id}
                className={`group relative rounded-xl border p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 ${
                  currentTrack?._id === music._id
                    ? "border-indigo-500/50 bg-white/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06]"
                }`}
              >
                {/* Artwork */}
                <div
                  className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-900 mb-3 shadow-lg shadow-black/30 cursor-pointer"
                  onClick={() => handlePlay(music)}
                >
                  {music.thumbnailUrl || music.thumbnail ? (
                    <img
                      src={music.thumbnailUrl || music.thumbnail}
                      alt={music.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <MusicIcon className="w-10 h-10 text-gray-600" />
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentTrack?._id === music._id && isPlaying ? (
                      <Pause className="w-8 h-8 text-white" fill="white" />
                    ) : (
                      <Play className="w-8 h-8 text-white" fill="white" />
                    )}
                  </div>
                </div>

                {/* Info & Menu */}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-sm font-bold text-white truncate cursor-pointer flex-1"
                    onClick={() => handlePlay(music)}
                  >
                    {music.title}
                  </h3>

                  {/* 3-dot menu */}
                  {user && String(user._id) === String(music.artist?._id) && (
                    <div className="relative flex-shrink-0 music-menu-container">
                      <button
                        onClick={(e) => toggleMenu(e, music._id)}
                        className="p-1 text-gray-500 hover:text-white music-menu-btn"
                        aria-label="Track options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown */}
                      {activeMenu === music._id && (
                        <div className="absolute right-0 top-full mt-2 w-36 rounded-lg bg-gray-800 border border-white/10 shadow-xl z-10 music-menu-dropdown">
                          <button
                            onClick={(e) => handleDelete(e, music._id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Infinite Scroll Loader */}
            {hasMore && (
              <div
                ref={observerTarget}
                className="py-8 flex justify-center col-span-full"
              >
                <div className="text-center space-y-2">
                  <Disc className="w-8 h-8 text-indigo-500 mx-auto spinner-ring" />
                  <p className="text-xs text-gray-500">
                    Loading more tracks...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Music;
