import { useMusic } from "./MusicContext";
import {
  Play,
  Pause,
  Volume2,
  Music as MusicIcon,
  SkipBack,
  SkipForward,
} from "lucide-react";

const Player = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    progress,
    seek,
    volume,
    setVolume,
    playNext,
    playPrevious,
    playlist,
    duration,
  } = useMusic();

  if (!currentTrack) return null;

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] h-28 border-t border-white/5 bg-black/80 backdrop-blur-3xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-8 gap-8">
        
        {/* Identity & Art */}
        <div className="flex items-center gap-5 w-[25%] min-w-0">
          <div className="group relative h-16 w-16 flex-shrink-0 rounded-2xl bg-neutral-900 border border-white/5 overflow-hidden shadow-2xl">
            {currentTrack.thumbnailUrl || currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnailUrl || currentTrack.thumbnail}
                alt={currentTrack.title}
                className={`h-full w-full object-cover transition-transform duration-[10s] linear ${isPlaying ? "scale-125" : "scale-100"}`}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <MusicIcon className="w-6 h-6 text-neutral-700" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate leading-tight">
              {currentTrack.title}
            </h4>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1 truncate">
              {currentTrack.artist?.username || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Command Center */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="flex items-center gap-8">
            <button
              onClick={playPrevious}
              disabled={playlist.length <= 1}
              className="text-neutral-600 hover:text-white transition-all disabled:opacity-20 active:scale-90"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-white blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>
            <button
              onClick={playNext}
              disabled={playlist.length <= 1}
              className="text-neutral-600 hover:text-white transition-all disabled:opacity-20 active:scale-90"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          <div className="w-full max-w-xl flex items-center gap-4">
            <span className="text-[10px] font-black text-neutral-600 w-10 text-right font-mono">
              {formatTime((progress * duration) / 100)}
            </span>
            <div className="relative flex-1 group py-2 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => seek(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-[3px] bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-150 relative"
                  style={{ width: `${progress}%` }}
                >
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-0 group-hover:scale-100 transition-transform" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-neutral-600 w-10 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Auxiliary Controls */}
        <div className="hidden lg:flex items-center justify-end gap-5 w-[25%]">
          <div className="flex items-center gap-3 group">
            <Volume2 className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
            <div className="relative w-24 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-[3px] bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-150"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Player;
