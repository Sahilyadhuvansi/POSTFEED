import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    // Persist volume preference across sessions
    return parseFloat(localStorage.getItem("playerVolume") || "0.7");
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());
  const currentTrack = playlist[currentIndex] || null;

  // Persist volume preference
  useEffect(() => {
    audioRef.current.volume = volume;
    localStorage.setItem("playerVolume", String(volume));
  }, [volume]);

  // ─── Audio Event Listeners ───────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onMetadata = () => setDuration(audio.duration);
    const onEnded = () => playNext();
    const onError = (e) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, playlist.length]);

  // ─── Toggle Play/Pause ────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Playback error:", err));
    }
  }, [isPlaying, currentTrack]);

  // ─── Play a Track ─────────────────────────────────────────────────────────
  const playTrack = useCallback((track, newPlaylist) => {
    const targetPlaylist = newPlaylist || playlist;

    // Update playlist if a new one is supplied
    if (newPlaylist) setPlaylist(newPlaylist);

    const idx = targetPlaylist.findIndex((t) => t._id === track._id);
    if (idx === -1) {
      console.error("Track not found in playlist:", track._id);
      return;
    }

    // Same track → toggle
    if (currentIndex === idx && playlist === targetPlaylist) {
      togglePlay();
      return;
    }

    // New track → play it
    const src = track.audioUrl || track.uri;
    if (!src) {
      console.error("No audio source for track:", track._id);
      return;
    }

    audioRef.current.src = src;
    setCurrentIndex(idx);
    setProgress(0);
    setDuration(0);
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
  }, [currentIndex, playlist, togglePlay]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const playNext = useCallback(() => {
    if (!playlist.length) return;
    const next = (currentIndex + 1) % playlist.length;
    playTrack(playlist[next]);
  }, [currentIndex, playlist, playTrack]);

  const playPrevious = useCallback(() => {
    if (!playlist.length) return;
    // If more than 3 seconds in, restart track instead of going back
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prev = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prev]);
  }, [currentIndex, playlist, playTrack]);

  // ─── Seek ─────────────────────────────────────────────────────────────────
  const seek = useCallback((value) => {
    if (!audioRef.current.duration || isNaN(audioRef.current.duration)) return;
    audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
    setProgress(value);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentTrack, isPlaying, playTrack, togglePlay,
        volume, setVolume, progress, seek, duration,
        playlist, currentIndex, playNext, playPrevious,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside MusicProvider");
  return ctx;
};
