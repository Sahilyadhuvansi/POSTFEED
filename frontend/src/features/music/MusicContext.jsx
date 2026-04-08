import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import YouTube from "react-youtube";
import { normalizeYoutubeUrl } from "../../utils/youtube";

const MusicContext = createContext(null);

const extractVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match ? match[1] : null;
};

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
  const progressIntervalRef = useRef(null);
  const currentTrack = playlist[currentIndex] || null;
  const videoId = extractVideoId(currentTrack?.youtubeUrl);

  const getCurrentTime = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return 0;
    try {
      return await player.getCurrentTime();
    } catch {
      return 0;
    }
  }, []);

  const setCurrentTime = useCallback((seconds) => {
    const player = playerRef.current;
    if (!player || !Number.isFinite(seconds)) return;
    try {
      player.seekTo(seconds, true);
    } catch (e) {
      console.warn("Manual seek failed", e);
    }
  }, []);

  // ─── Playback Progress Polling ────────────────────────────────────────────
  const startProgressPolling = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(async () => {
      if (!playerRef.current) return;
      try {
        const currentTime = await playerRef.current.getCurrentTime();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      } catch (e) {
        // Ignore errors if player is not ready
      }
    }, 1000);
  }, [duration]);

  const stopProgressPolling = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Sync isPlaying with React-YouTube and polling
  useEffect(() => {
    if (isPlaying) {
      if (playerRef.current) {
        try {
          playerRef.current.playVideo();
          startProgressPolling();
        } catch (e) {
          console.warn("playVideo failed", e);
        }
      }
    } else {
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          console.warn("pauseVideo failed", e);
        }
      }
      stopProgressPolling();
    }
  }, [isPlaying, startProgressPolling, stopProgressPolling]);

  // Sync volume
  useEffect(() => {
    if (playerRef.current) {
      try {
        // YouTube API expects 0-100, our state is 0-1
        playerRef.current.setVolume(volume * 100);
      } catch (e) {
        /* ignore */
      }
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopProgressPolling();
  }, [stopProgressPolling]);

  // ─── Toggle Play/Pause ────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((p) => !p);
  }, [currentTrack]);

  // ─── Play a Track ─────────────────────────────────────────────────────────
  const playTrack = useCallback(
    (track, newPlaylist) => {
      if (!track?._id) return;

      const normalizedUrl = normalizeYoutubeUrl(track.youtubeUrl);
      if (!normalizedUrl) return;

      if (track.youtubeUrl !== normalizedUrl) {
        track.youtubeUrl = normalizedUrl;
      }

      const targetPlaylist = newPlaylist || playlist;
      if (newPlaylist) setPlaylist(newPlaylist);

      const idx = targetPlaylist.findIndex((t) => t._id === track._id);
      if (idx === -1) return;

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

  // ─── Skip Next / Previous ────────────────────────────────────────────────
  const playNext = useCallback(() => {
    if (!playlist.length) return;
    const next = (currentIndex + 1) % playlist.length;
    setCurrentIndex(next);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
  }, [currentIndex, playlist]);

  const playPrevious = useCallback(async () => {
    if (!playlist.length) return;
    const currentTime = await getCurrentTime();
    if (currentTime > 3) {
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

  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    localStorage.setItem("playerVolume", String(v));
  }, []);

  const onPlayerReady = async (event) => {
    console.log("✅ Engine ready:", currentTrack?.title);
    playerRef.current = event.target;
    playerRef.current.setVolume(volume * 100);
    if (isPlaying) {
      playerRef.current.playVideo();
      startProgressPolling();
    }
    try {
      const d = await event.target.getDuration();
      console.log("✅ Duration set:", d);
      setDuration(d);
    } catch (e) {
      console.warn("Could not get duration on ready");
    }
  };

  const onPlayerStateChange = async (event) => {
    // YT.PlayerState: PLAYING (1), PAUSED (2), ENDED (0)
    if (event.data === 1) { // Playing
      setIsPlaying(true);
      startProgressPolling();
      try {
        const d = await event.target.getDuration();
        if (d > 0 && d !== duration) setDuration(d);
      } catch (e) {}
    } else if (event.data === 2) { // Paused
      setIsPlaying(false);
      stopProgressPolling();
    } else if (event.data === 0) { // Ended
      playNext();
    }
  };

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

      {/* Background audio engine — positioned within the visible viewport but visually hidden */}
      {videoId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 200,
            height: 200,
            opacity: 0.01,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <YouTube
            videoId={videoId}
            opts={{
              height: '200',
              width: '200',
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                modestbranding: 1,
                rel: 0,
                origin: window.location.origin,
                enablejsapi: 1,
                playsinline: 1,
                controls: 0,
              },
            }}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={(e) => {
              console.error("❌ YouTube Player error:", e.data);
              playNext();
            }}
          />
        </div>
      )}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside MusicProvider");
  return ctx;
};
