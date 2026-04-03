import { useMemo } from "react";
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

  const coverArt = currentTrack.thumbnailUrl || currentTrack.thumbnail;
  const progressValue = useMemo(
    () => (Number.isFinite(progress) ? progress : 0),
    [progress],
  );

  return (
    <div className="fixed inset-0 z-[2000]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-2 sm:p-6">
        <div className="pointer-events-auto w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950/90 shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                Now playing
              </p>
              <h3 className="mt-1 truncate text-sm font-black uppercase tracking-widest text-white">
                {currentTrack.title}
              </h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-300">
              Cover mode
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative flex min-h-[320px] items-center justify-center bg-gradient-to-br from-white/[0.05] via-neutral-950 to-black p-6 sm:min-h-[520px] sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_bottom,rgba(236,72,153,0.12),transparent_40%)]" />
              <div className="relative w-full max-w-[420px]">
                <div className="aspect-square overflow-hidden rounded-[32px] border border-white/10 bg-neutral-900 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                  {coverArt ? (
                    <img
                      src={coverArt}
                      alt={currentTrack.title}
                      className={`h-full w-full object-cover transition-transform duration-[10s] ${isPlaying ? "scale-110" : "scale-100"}`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MusicIcon className="h-16 w-16 text-neutral-700" />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-indigo-500/10 mix-blend-screen animate-pulse" />
                  )}
                </div>

                <div className="mt-6 space-y-2 text-center">
                  <h4 className="text-2xl font-black italic tracking-tight text-white sm:text-4xl">
                    {currentTrack.title}
                  </h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">
                    {currentTrack.artist?.username || "Unknown Artist"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-8 p-5 sm:p-8">
              <div className="flex items-center justify-center gap-8 pt-2">
                <button
                  onClick={playPrevious}
                  disabled={playlist.length <= 1}
                  className="rounded-full border border-white/10 bg-white/[0.04] p-4 text-neutral-500 transition-all hover:text-white disabled:opacity-25 active:scale-95"
                >
                  <SkipBack className="h-6 w-6 fill-current" />
                </button>
                <button
                  onClick={togglePlay}
                  className="group relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white text-black shadow-[0_0_60px_rgba(255,255,255,0.18)] transition-transform hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 rounded-full bg-white blur-xl opacity-0 transition-opacity group-hover:opacity-20" />
                  {isPlaying ? (
                    <Pause className="h-7 w-7 fill-current" />
                  ) : (
                    <Play className="ml-1 h-7 w-7 fill-current" />
                  )}
                </button>
                <button
                  onClick={playNext}
                  disabled={playlist.length <= 1}
                  className="rounded-full border border-white/10 bg-white/[0.04] p-4 text-neutral-500 transition-all hover:text-white disabled:opacity-25 active:scale-95"
                >
                  <SkipForward className="h-6 w-6 fill-current" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">
                  <span>{formatTime((progressValue * duration) / 100)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative flex items-center py-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressValue}
                    onChange={(e) => seek(e.target.value)}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-400 to-pink-500 transition-all duration-150"
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
                <Volume2 className="h-4 w-4 text-neutral-500" />
                <div className="relative flex-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-150"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-[10px] font-black uppercase tracking-[0.35em] text-neutral-500">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
