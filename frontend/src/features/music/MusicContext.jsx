import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import ReactPlayer from "react-player/youtube";

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem("playerVolume") || "0.7");
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const currentTrack = playlist[currentIndex] || null;

  useEffect(() => {
    localStorage.setItem("playerVolume", String(volume));
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((p) => !p);
  }, [currentTrack]);

  const playTrack = useCallback((track, newPlaylist) => {
    const targetPlaylist = newPlaylist || playlist;
    if (newPlaylist) setPlaylist(newPlaylist);

    const idx = targetPlaylist.findIndex((t) => t._id === track._id);
    if (idx === -1) return;

    if (currentIndex === idx && playlist === targetPlaylist) {
      togglePlay();
      return;
    }

    setCurrentIndex(idx);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
  }, [currentIndex, playlist, togglePlay]);

  const playNext = useCallback(() => {
    if (!playlist.length) return;
    const next = (currentIndex + 1) % playlist.length;
    playTrack(playlist[next]);
  }, [currentIndex, playlist, playTrack]);

  const playPrevious = useCallback(() => {
    if (!playlist.length) return;
    if (playerRef.current && playerRef.current.getCurrentTime() > 3) {
      playerRef.current.seekTo(0);
      return;
    }
    const prev = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prev]);
  }, [currentIndex, playlist, playTrack]);

  const seek = useCallback((value) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value / 100, "fraction");
      setProgress(value);
    }
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
      {currentTrack && (
        <div style={{ display: 'none' }}>
          <ReactPlayer
            ref={playerRef}
            url={currentTrack.youtubeUrl || currentTrack.audioUrl}
            playing={isPlaying}
            volume={volume}
            controls={false}
            onProgress={({ played }) => setProgress(played * 100)}
            onDuration={(d) => setDuration(d)}
            onEnded={playNext}
            config={{
                youtube: {
                  playerVars: { modestbranding: 1 }
                }
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
