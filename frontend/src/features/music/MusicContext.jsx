import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import ReactPlayer from "react-player";

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() =>
    parseFloat(localStorage.getItem("playerVolume") || "0.7"),
  );
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const currentTrack = playlist[currentIndex] || null;

  // ─── Toggle Play/Pause ────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((p) => !p);
  }, [currentTrack]);

  // ─── Play a Track ─────────────────────────────────────────────────────────
  const playTrack = useCallback(
    (track, newPlaylist) => {
      const targetPlaylist = newPlaylist || playlist;
      if (newPlaylist) setPlaylist(newPlaylist);

      const idx = targetPlaylist.findIndex((t) => t._id === track._id);
      if (idx === -1) return;

      // Same track already loaded → just toggle play/pause
      if (currentIndex === idx && !newPlaylist) {
        togglePlay();
        return;
      }

      setCurrentIndex(idx);
      setProgress(0);
      setDuration(0);
      setIsPlaying(true);
      localStorage.setItem("playerVolume", String(volume));
    },
    [currentIndex, playlist, togglePlay, volume],
  );

  // ─── Skip Next ────────────────────────────────────────────────────────────
  const playNext = useCallback(() => {
    if (!playlist.length) return;
    const next = (currentIndex + 1) % playlist.length;
    setCurrentIndex(next);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
  }, [currentIndex, playlist]);

  // ─── Skip Previous ────────────────────────────────────────────────────────
  const playPrevious = useCallback(() => {
    if (!playlist.length) return;
    // If more than 3 seconds in — restart current track
    if (playerRef.current && playerRef.current.getCurrentTime() > 3) {
      playerRef.current.seekTo(0);
      return;
    }
    const prev = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prev);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
  }, [currentIndex, playlist]);

  // ─── Seek ─────────────────────────────────────────────────────────────────
  const seek = useCallback((value) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value / 100, "fraction");
      setProgress(value);
    }
  }, []);

  // ─── Volume persist ───────────────────────────────────────────────────────
  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    localStorage.setItem("playerVolume", String(v));
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playTrack,
        togglePlay,
        volume,
        setVolume: handleVolumeChange,
        progress,
        seek,
        duration,
        playlist,
        currentIndex,
        playNext,
        playPrevious,
      }}
    >
      {children}

      {/* Hidden YouTube player — audio only, no visible UI */}
      {currentTrack && (
        <div
          className="fixed bottom-32 right-8 z-[70] overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl transition-all duration-500 shadow-2xl group hover:scale-105"
          style={{
            width: "280px",
            height: "157px",
            opacity: isPlaying ? 1 : 0,
            pointerEvents: isPlaying ? "auto" : "none",
            transform: isPlaying ? "translateY(0)" : "translateY(20px)"
          }}
        >
          <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
            <p className="text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live Visuals
            </p>
          </div>
          <ReactPlayer
            ref={playerRef}
            url={currentTrack.youtubeUrl}
            playing={isPlaying}
            volume={volume}
            muted={false}
            controls={true} // Enabled controls so you can manually 'unmute' or 'play' if the browser blocks it
            width="100%"
            height="100%"
            onProgress={({ played }) => setProgress(played * 100)}
            onDuration={(d) => setDuration(d)}
            onEnded={playNext}
            onReady={() => console.log("✅ YouTube Player Ready:", currentTrack?.title)}
            onStart={() => console.log("▶️ Playback Started:", currentTrack?.title)}
            onError={(e) => {
              console.error("❌ Player Error:", e);
              playNext();
            }}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  modestbranding: 1,
                  rel: 0,
                  iv_load_policy: 3,
                  origin: window.location.origin,
                  enablejsapi: 1
                },
              },
            }}
          />
        </div>
      )}
    </MusicContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside MusicProvider");
  return ctx;
};
