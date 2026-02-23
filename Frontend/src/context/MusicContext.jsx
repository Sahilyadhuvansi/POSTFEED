import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());
  const currentTrack = playlist[currentIndex] || null;

  // --- Audio Event Listeners ---
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => playNext(); // Auto-play next song

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, playlist.length]); // Re-attach if playlist changes

  // --- Volume Control ---
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // --- Core Playback Logic ---
  const playTrack = useCallback(
    (track, newPlaylist) => {
      // If a new playlist is provided, set it.
      if (
        newPlaylist &&
        JSON.stringify(newPlaylist) !== JSON.stringify(playlist)
      ) {
        setPlaylist(newPlaylist);
      }

      const targetPlaylist = newPlaylist || playlist;
      const trackIndex = targetPlaylist.findIndex((t) => t._id === track._id);

      if (trackIndex === -1) {
        console.error("Track not found in playlist:", track);
        return;
      }

      // If it's the same track, toggle play/pause
      if (currentIndex === trackIndex) {
        togglePlay();
      } else {
        // Otherwise, play the new track
        setCurrentIndex(trackIndex);
        const audioSource = track.audioUrl || track.uri;
        if (!audioSource) {
          console.error("Audio source not found for track:", track);
          return;
        }
        audioRef.current.src = audioSource;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error("Audio playback failed:", error);
            setIsPlaying(false);
          });
      }
    },
    [currentIndex, playlist],
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Toggle play failed:", err));
    }
  }, [isPlaying, currentTrack]);

  // --- Playlist Navigation ---
  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIndex]);
  }, [currentIndex, playlist, playTrack]);

  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prevIndex]);
  }, [currentIndex, playlist, playTrack]);

  // --- Seek Functionality ---
  const seek = (value) => {
    if (audioRef.current.duration) {
      const time = (value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value);
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
        setVolume,
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
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
