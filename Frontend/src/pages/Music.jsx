import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useMusic } from "../context/MusicContext";
import { useAuth } from "../context/AuthContext";
import { Play, Pause, Music as MusicIcon, Disc, Trash2 } from "lucide-react";
import { API_URL } from "../config";
import { MusicSkeleton } from "../components/SkeletonLoader";
import { usePageReady } from "../hooks/usePageReady";
import { useApiCache } from "../hooks/useApiCache";

const Music = () => {
  const [musics, setMusics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { user } = useAuth();

  const apiUrl = API_URL;
  const MUSIC_PER_PAGE = 15;
  const { getFromCache, setCache } = useApiCache();
  const observerTarget = useRef(null);

  // Signal when page is ready to display
  usePageReady(!loading);

  // Load initial music with caching
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
          `${apiUrl}/api/music?page=1&limit=${MUSIC_PER_PAGE}`,
        );
        const newMusics = response.data.musics || [];
        setMusics(newMusics);
        setPage(1);
        setHasMore(newMusics.length === MUSIC_PER_PAGE);

        // Cache first page
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
  }, [apiUrl, getFromCache, setCache]);

  // Infinite scroll handler
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
  }, [hasMore, loading]);

  const loadMoreMusic = () => {
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
      .get(`${apiUrl}/api/music?page=${nextPage}&limit=${MUSIC_PER_PAGE}`)
      .then((res) => {
        const newMusics = res.data.musics || [];
        setMusics((prev) => [...prev, ...newMusics]);
        setPage(nextPage);
        setHasMore(newMusics.length === MUSIC_PER_PAGE);

        // Cache this page
        setCache(cacheKey, { musics: newMusics });
      })
      .catch((err) => {
        console.error("Load more error:", err.message);
      });
  };

  const handleDelete = async (e, musicId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this track?")) return;

    try {
      await axios.delete(`${apiUrl}/api/music/${musicId}`);
      setMusics(musics.filter((m) => m._id !== musicId));
    } catch (error) {
      const message =
        error.response?.status === 401
          ? "You are not logged in. Please log in and try again."
          : error.response?.status === 403
            ? "You don't have permission to delete this track."
            : error.response?.data?.error ||
              "Failed to delete track. Please try again.";
      alert(message);
    }
  };

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
                className={`group relative cursor-pointer rounded-xl border p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 ${
                  currentTrack?._id === music._id
                    ? "border-indigo-500/50 bg-white/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06]"
                }`}
                onClick={() => playTrack(music)}
              >
                {/* Artwork */}
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-900 mb-3 shadow-lg shadow-black/30">
                  {music.thumbnail ? (
                    <img
                      src={music.thumbnail}
                      alt={music.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <MusicIcon className="w-10 h-10 text-gray-600" />
                    </div>
                  )}

                  {/* Play overlay */}
                  <button className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {currentTrack?._id === music._id && isPlaying ? (
                      <Pause className="w-4 h-4 text-white" fill="white" />
                    ) : (
                      <Play
                        className="w-4 h-4 text-white ml-0.5"
                        fill="white"
                      />
                    )}
                  </button>

                  {/* Delete button */}
                  {user &&
                    (user.id === music.artist?._id ||
                      user.id === music.artist) && (
                      <button
                        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 backdrop-blur-sm text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:scale-110"
                        onClick={(e) => handleDelete(e, music._id)}
                        title="Delete track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                </div>

                {/* Info */}
                <h3 className="text-sm font-bold text-white truncate">
                  {music.title}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {music.artist?.username || "Unknown artist"}
                </p>
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
