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

  const getCurrentTime = useCallback(() => {
    const player = playerRef.current;
    if (!player) return 0;
    if (typeof player.currentTime === "number") return player.currentTime;
    if (typeof player.getCurrentTime === "function")
      return player.getCurrentTime();
    return 0;
  }, []);

  const setCurrentTime = useCallback((seconds) => {
    const player = playerRef.current;
    if (!player || !Number.isFinite(seconds)) return;

    if (typeof player.currentTime === "number") {
      player.currentTime = seconds;
      return;
    }

    if (typeof player.seekTo === "function") {
      player.seekTo(seconds, "seconds");
    }
  }, []);

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
    if (getCurrentTime() > 3) {
      setCurrentTime(0);
      return;
    }
    const prev = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prev);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
  }, [currentIndex, getCurrentTime, playlist, setCurrentTime]);

  // ─── Seek ─────────────────────────────────────────────────────────────────
  const seek = useCallback(
    (value) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || duration <= 0) return;
      const nextTime = (numeric / 100) * duration;
      setCurrentTime(nextTime);
      setProgress(numeric);
    },
    [duration, setCurrentTime],
  );

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

      {/* Hidden YouTube player — background audio only */}
      {currentTrack && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "1px",
            height: "1px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            overflow: "hidden",
          }}
        >
          <ReactPlayer
            ref={playerRef}
            src={currentTrack.youtubeUrl}
            playing={isPlaying}
            volume={volume}
            muted={false}
            controls={false}
            width="100%"
            height="100%"
            onTimeUpdate={(e) => {
              const media = e.currentTarget;
              const d = Number(media?.duration) || duration;
              const t = Number(media?.currentTime) || 0;
              if (d > 0) {
                setDuration(d);
                setProgress((t / d) * 100);
              }
            }}
            onDurationChange={(e) => {
              const d = Number(e.currentTarget?.duration) || 0;
              if (d > 0) setDuration(d);
            }}
            onEnded={playNext}
            onError={() => playNext()}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  modestbranding: 1,
                  rel: 0,
                  iv_load_policy: 3,
                  origin: window.location.origin,
                  enablejsapi: 1,
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
