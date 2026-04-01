import { createContext, useContext, useState, useRef, useCallback } from "react";
import ReactPlayer from "react-player/youtube";

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() =>
    parseFloat(localStorage.getItem("playerVolume") || "0.7")
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
    [currentIndex, playlist, togglePlay, volume]
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
        <div style={{ position: "fixed", bottom: -9999, left: -9999, width: 1, height: 1, overflow: "hidden", pointerEvents: "none" }}>
          <ReactPlayer
            ref={playerRef}
            url={currentTrack.youtubeUrl}
            playing={isPlaying}
            volume={volume}
            controls={false}
            width="1px"
            height="1px"
            onProgress={({ played }) => setProgress(played * 100)}
            onDuration={(d) => setDuration(d)}
            onEnded={playNext}
            onError={() => {
              // This video is blocked/unavailable — silently skip to next
              console.warn("Track unavailable, skipping:", currentTrack?.title);
              playNext();
            }}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  iv_load_policy: 3,
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
