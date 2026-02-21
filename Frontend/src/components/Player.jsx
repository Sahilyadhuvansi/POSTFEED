import { useMusic } from "../context/MusicContext";
import { Play, Pause, Volume2, Music as MusicIcon } from "lucide-react";

const Player = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    progress,
    seek,
    volume,
    setVolume,
  } = useMusic();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t border-white/[0.06] bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-800 overflow-hidden flex items-center justify-center">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <MusicIcon className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentTrack.artist?.username || "Artist"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1.5 w-[40%]">
          <div className="flex items-center gap-5">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white hover:scale-110 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-black" fill="black" />
              ) : (
                <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
              )}
            </button>
          </div>
          <div className="w-full max-w-md">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => seek(e.target.value)}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 hover:[&::-webkit-slider-thumb]:w-3 hover:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:transition-all"
            />
          </div>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center justify-end gap-2 w-[30%] text-gray-500">
          <Volume2 className="w-4 h-4" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
