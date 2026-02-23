import { useMusic } from "../context/MusicContext";
import {
  Play,
  Pause,
  Volume2,
  Music as MusicIcon,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const Player = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    seek,
    volume,
    setVolume,
    playNext,
    playPrevious,
    playlist,
  } = useMusic();

  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    if (audio) {
      audio.addEventListener("timeupdate", updateTime);
    }

    return () => {
      if (audio) {
        audio.removeEventListener("timeupdate", updateTime);
      }
    };
  }, []);

  const formatTime = (time) => {
    if (!time) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t border-white/[0.06] bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-800 overflow-hidden flex items-center justify-center">
            {currentTrack.thumbnailUrl || currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnailUrl || currentTrack.thumbnail}
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
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1.5 w-[40%]">
          <div className="flex items-center gap-5">
            <button
              onClick={playPrevious}
              disabled={playlist.length <= 1}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous track"
            >
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white hover:scale-110 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-black" fill="black" />
              ) : (
                <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
              )}
            </button>
            <button
              onClick={playNext}
              disabled={playlist.length <= 1}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next track"
            >
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>
          </div>
          <div className="w-full max-w-md flex items-center gap-2 text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={(currentTime / duration) * 100 || 0}
              onChange={(e) => seek(e.target.value)}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:transition-all"
            />
            <span>{formatTime(duration)}</span>
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
