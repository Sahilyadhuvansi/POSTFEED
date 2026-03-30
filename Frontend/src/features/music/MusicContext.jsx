// ─── Commit: Music context - audio Engine State ───
// What this does: Manages the global audio player, playlist, and volume.
// Why it exists: To allow music to play continuously while the user browses the app.
// How it works: Wraps the native HTML5 Audio API in a React Context.
// Beginner note: This is the "CD Player" of the application—it holds the disc and controls the volume.

import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  // ─── Commit: Player State Management ───
  // What this does: Tracks the current song, progress, and playback status.

  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem("playerVolume") || "0.7");
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // ─── Commit: Persistent audio Reference ───
  // why it exists: useRef keeps the same Audio object alive for the entire session.
  // Interview insight: Using useRef for native DOM/Web elements prevents unnecessary re-renders when their internal state changes.

  const audioRef = useRef(new Audio());
  const currentTrack = playlist[currentIndex] || null;

  // Persist volume preference
  useEffect(() => {
    audioRef.current.volume = volume;
    localStorage.setItem("playerVolume", String(volume));
  }, [volume]);

  // ─── Commit: Audio Event Orchestration ───
  // What this does: Syncs the native <audio> events (like time update) with React state.
  // How it works: Adds specialized event listeners to the Audio object and cleans them up on unmount.

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

  // ─── Commit: Playback Logic ───
  // What this does: toggles between play/pause and handles track switching.

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

  const playTrack = useCallback((track, newPlaylist) => {
    const targetPlaylist = newPlaylist || playlist;

    if (newPlaylist) setPlaylist(newPlaylist);

    const idx = targetPlaylist.findIndex((t) => t._id === track._id);
    if (idx === -1) {
      console.error("Track not found in playlist:", track._id);
      return;
    }

    if (currentIndex === idx && playlist === targetPlaylist) {
      togglePlay();
      return;
    }

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

  // ─── Commit: Navigation Controls ───
  // What this does: Logic for "Next" and "Previous" track switching.

  const playNext = useCallback(() => {
    if (!playlist.length) return;
    const next = (currentIndex + 1) % playlist.length;
    playTrack(playlist[next]);
  }, [currentIndex, playlist, playTrack]);

  const playPrevious = useCallback(() => {
    if (!playlist.length) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prev = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prev]);
  }, [currentIndex, playlist, playTrack]);

  // ─── Commit: Scrubbing (Seek) Logic ───
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

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside MusicProvider");
  return ctx;
};

