import { useEffect, useState } from "react";
import axios from "axios";
import { useMusic } from "../context/MusicContext";
import { useAuth } from "../context/AuthContext";
import { Play, Pause, Music as MusicIcon, Disc, Trash2 } from "lucide-react";

const Music = () => {
  const [musics, setMusics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { user } = useAuth();

  const musicApiUrl =
    import.meta.env.VITE_MUSIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchMusics = async () => {
      try {
        const response = await axios.get(`${musicApiUrl}/api/music`);
        setMusics(response.data.musics);
      } catch (error) {
        console.error("Failed to fetch musics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMusics();
  }, [musicApiUrl]);

  const handleDelete = async (e, musicId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this track?")) return;

    try {
      await axios.delete(`${musicApiUrl}/api/music/${musicId}`);
      setMusics(musics.filter((m) => m._id !== musicId));
    } catch (error) {
      console.error("Failed to delete music", error);
      alert(error.response?.data?.message || "Failed to delete track");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Disc className="h-12 w-12 mx-auto text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading tracks...</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Music;
