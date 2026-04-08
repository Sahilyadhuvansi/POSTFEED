import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import ReactPlayer from "react-player";
import { normalizeYoutubeUrl } from "../../utils/youtube";

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
      if (!track?._id) {
        console.error("❌ Track missing _id:", track);
        return;
      }

      // Validate and normalize YouTube URL
      const normalizedUrl = normalizeYoutubeUrl(track.youtubeUrl);
      if (!normalizedUrl) {
        console.error(
          "❌ Invalid YouTube URL:",
          track.youtubeUrl,
          "Track:",
          track,
        );
        return;
      }

      // Ensure track has normalized youtubeUrl
      if (track.youtubeUrl !== normalizedUrl) {
        track.youtubeUrl = normalizedUrl;
      }

      const targetPlaylist = newPlaylist || playlist;
      if (newPlaylist) setPlaylist(newPlaylist);

      const idx = targetPlaylist.findIndex((t) => t._id === track._id);
      if (idx === -1) {
        console.error("❌ Track not found in playlist:", track._id);
        return;
      }

      // Same track already loaded → just toggle play/pause
      if (currentIndex === idx && !newPlaylist) {
        togglePlay();
        return;
      }

      console.log("✅ Playing track:", track.title, "Index:", idx);
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

      {/* Background audio engine — uses a small visible iframe to avoid
          browser throttling. The player must remain technically "visible"
          (not opacity:0 / display:none / negative z-index) or Chromium will
          suspend the YouTube iframe and prevent playback.  We place a 1×1 px
          element in the bottom-left corner with clip to hide it visually
          while keeping it alive for the browser engine. */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 1,
          pointerEvents: "none",
          zIndex: 9999,
          clip: "rect(0,1px,1px,0)",
        }}
      >
        <ReactPlayer
          key="global-music-engine"
          ref={playerRef}
          url={currentTrack?.youtubeUrl || ""}
          playing={isPlaying}
          volume={volume}
          muted={false}
          controls={false}
          width="1px"
          height="1px"
          onReady={() => {
            if (currentTrack) console.log("✅ Engine ready:", currentTrack.title);
          }}
          onPlay={() => {
            if (currentTrack) {
              console.log("▶️ Playing:", currentTrack.title);
              setIsPlaying(true);
            }
          }}
          onPause={() => setIsPlaying(false)}
          onBuffer={() => console.log("⏳ Buffering...")}
          onBufferEnd={() => console.log("✅ Buffer end")}
          onProgress={(state) => {
            if (state.playedSeconds > 0 || state.played > 0) {
              setProgress(state.played * 100);
            }
          }}
          onDuration={(d) => {
            console.log("✅ Duration set:", d);
            setDuration(d);
          }}
          onEnded={playNext}
          onError={(err) => {
            if (currentTrack) {
              console.error("❌ Player error:", err);
              playNext();
            }
          }}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                modestbranding: 1,
                rel: 0,
                iv_load_policy: 3,
                origin: window.location.origin,
                enablejsapi: 1,
                widget_referrer: window.location.origin,
                playsinline: 1,
                controls: 0,
              },
            },
          }}
        />
      </div>
    </MusicContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside MusicProvider");
  return ctx;
};
