import { useState, useEffect, useRef, useCallback } from "react";
import { useMusic } from "../features/music/MusicContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { Disc } from "lucide-react";
import api from "../services/api";
import { MusicSkeleton } from "../components/SkeletonLoader";
import { GENRES } from "./music/constants";
import {
  searchYouTubeContent,
  fetchPlaylistTracks,
} from "./music/youtube.service";
import { normalizeYoutubeUrl } from "../utils/youtube";
import MusicCard from "./music/MusicCard";
import ApiKeyRequired from "./music/ApiKeyRequired";
import MusicBrowseControls from "./music/MusicBrowseControls";

const Music = () => {
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { addToast } = useToast();
  const location = useLocation();

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [playlistMeta, setPlaylistMeta] = useState(null);
  const [savedByUrl, setSavedByUrl] = useState({});
  const [bollywoodAlbums, setBollywoodAlbums] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const hydrateSavedMap = useCallback(async () => {
    try {
      const res = await api.get("/music/mine");
      const map = (res.data?.musics || []).reduce((acc, item) => {
        if (item.youtubeUrl) {
          // Normalize URL from backend to standard format
          const normalizedUrl = normalizeYoutubeUrl(item.youtubeUrl);
          if (normalizedUrl) {
            acc[normalizedUrl] = {
              ...item,
              youtubeUrl: normalizedUrl,
              _id: item._id || item.id,
            };
          }
        }
        return acc;
      }, {});
      setSavedByUrl(map);
    } catch {
      // Silent fail for guests / auth issues
    }
  }, []);

  const toggleFavorite = async (track) => {
    if (!track?.youtubeUrl) return;
    setSavingId(track._id);
    try {
      // Normalize URL for consistent lookups
      const normalizedUrl = normalizeYoutubeUrl(track.youtubeUrl);
      if (!normalizedUrl) {
        addToast("Invalid track URL", "error");
        setSavingId(null);
        return;
      }

      const existing = savedByUrl[normalizedUrl];

      if (existing?._id) {
        await api.delete(`/music/${existing._id}`);
        setSavedByUrl((prev) => {
          const next = { ...prev };
          delete next[normalizedUrl];
          return next;
        });
        addToast("Removed from favorites", "info");
        return;
      }

      const res = await api.post("/music", {
        title: track.title,
        youtubeUrl: normalizedUrl,
        thumbnailUrl: track.thumbnail,
      });

      const saved = res.data?.music;
      if (saved?.youtubeUrl) {
        const savedNormalizedUrl = normalizeYoutubeUrl(saved.youtubeUrl);
        if (savedNormalizedUrl) {
          setSavedByUrl((prev) => ({
            ...prev,
            [savedNormalizedUrl]: {
              ...saved,
              youtubeUrl: savedNormalizedUrl,
              _id: saved._id || saved.id,
            },
          }));
        }
      }

      addToast("Added to favorites", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to save track", "error");
    } finally {
      setSavingId(null);
    }
  };

  const runSearch = useCallback(
    async (term, options = {}) => {
      const { showBollywoodSections = false } = options;
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setTracks([]);
      setBollywoodAlbums([]);
      try {
        if (showBollywoodSections) {
          const [songs, albums] = await Promise.all([
            searchYouTubeContent(term, abortRef.current.signal, {
              type: "video",
              maxResults: "24",
            }),
            searchYouTubeContent(
              "bollywood full album playlist jukebox",
              abortRef.current.signal,
              {
                type: "playlist",
                maxResults: "12",
              },
            ),
          ]);

          setTracks(songs);
          setBollywoodAlbums(albums);

          if (songs.length === 0 && albums.length === 0) {
            addToast("No results found. Try a different search.", "info");
          }
        } else {
          const results = await searchYouTubeContent(
            term,
            abortRef.current.signal,
            options,
          );
          setTracks(results);
          if (results.length === 0) {
            addToast("No results found. Try a different search.", "info");
          }
        }

        setPlaylistMeta(null);
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        if (err.message === "quota") {
          addToast("YouTube daily quota reached. Try again tomorrow.", "error");
        } else if (err.message?.includes("VITE_YOUTUBE_API_KEY")) {
          setApiKeyMissing(true);
        } else {
          addToast("Search failed. Check your connection.", "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  // Load default genre on mount
  useEffect(() => {
    runSearch(GENRES[0].term, { type: "video", maxResults: "30" });
    hydrateSavedMap();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (isSearching) {
        setIsSearching(false);
        const activeLabel = GENRES[activeGenre]?.label;
        const isTrending = activeLabel === "Trending";
        const isBollywood = activeLabel === "Bollywood";

        if (isBollywood) {
          runSearch(GENRES[activeGenre].term, { showBollywoodSections: true });
        } else if (isTrending) {
          runSearch(GENRES[activeGenre].term, {
            type: "video",
            maxResults: "30",
          });
        } else {
          runSearch(GENRES[activeGenre].term);
        }
      }
      return;
    }
    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(searchQuery.trim());
    }, 500);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleGenreClick = (idx) => {
    setActiveGenre(idx);
    setSearchQuery("");
    setIsSearching(false);
    setPlaylistMeta(null);
    setShowFavoritesOnly(false);
    const label = GENRES[idx].label;
    if (label === "Bollywood") {
      runSearch(GENRES[idx].term, { showBollywoodSections: true });
      return;
    }
    if (label === "Trending") {
      runSearch(GENRES[idx].term, { type: "video", maxResults: "30" });
      return;
    }
    runSearch(GENRES[idx].term);
  };

  const handleOpenPlaylist = async (playlist) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const playlistTracks = await fetchPlaylistTracks(
        playlist,
        abortRef.current.signal,
      );
      setTracks(playlistTracks);
      setPlaylistMeta({
        title: playlist.title,
        artist: playlist.artist?.username,
      });
      if (!playlistTracks.length) {
        addToast("No playable tracks found in this album/playlist.", "info");
      }
    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError") return;
      if (err.message === "quota") {
        addToast("YouTube daily quota reached. Try again tomorrow.", "error");
      } else {
        addToast("Could not open album right now.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const playableTracks = tracks.filter((t) => !t.isPlaylist && t.youtubeUrl);
  const favoriteTracks = Object.values(savedByUrl).map((item) => ({
    _id: item._id || `fav_${item.youtubeUrl}`,
    title: item.title,
    artist: {
      username:
        item.artist?.username ||
        item.artist?.name ||
        item.artistName ||
        "Saved",
    },
    thumbnail: item.thumbnailUrl || item.thumbnail,
    youtubeUrl: item.youtubeUrl,
    isPlaylist: false,
  }));
  const visibleTracks = showFavoritesOnly ? favoriteTracks : tracks;
  const playableVisibleTracks = visibleTracks.filter(
    (t) => !t.isPlaylist && t.youtubeUrl,
  );
  const isBollywoodView =
    !showFavoritesOnly &&
    !isSearching &&
    GENRES[activeGenre]?.label === "Bollywood" &&
    !playlistMeta;
  const activeGenreLabel = showFavoritesOnly
    ? "Favorites"
    : GENRES[activeGenre]?.label || "Discover";

  // Deep link support
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const playId = params.get("play");
    if (playId && playableVisibleTracks.length > 0) {
      const track = playableVisibleTracks.find((t) => t._id === playId);
      if (track) playTrack(track, playableVisibleTracks);
    }
  }, [location.search, playableVisibleTracks, playTrack]);

  // API key missing — show setup instructions
  if (apiKeyMissing) {
    return <ApiKeyRequired />;
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="mx-auto max-w-[1400px] px-6 pt-16">
        <MusicBrowseControls
          tracksCount={visibleTracks.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          activeGenre={activeGenre}
          handleGenreClick={handleGenreClick}
          playlistMeta={playlistMeta}
          setPlaylistMeta={setPlaylistMeta}
          runSearch={runSearch}
        />

        {/* Content */}
        {loading && !showFavoritesOnly ? (
          <MusicSkeleton />
        ) : visibleTracks.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center p-12 glass rounded-[48px] border-white/5">
            <div className="relative mb-8">
              <div className="w-24 h-24 glass-dark rounded-full flex items-center justify-center animate-pulse">
                <Disc className="w-10 h-10 text-neutral-800" />
              </div>
              <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 italic">
              {showFavoritesOnly ? "No favorites yet" : "No results"}
            </h2>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest text-center">
              {showFavoritesOnly
                ? "Tap heart to save tracks"
                : "Try another search"}
            </p>
          </div>
        ) : (
          <>
            {!playlistMeta && (
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {isSearching ? `Search · ${searchQuery}` : activeGenreLabel}
                  </h2>
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black">
                  {visibleTracks.length} items
                </p>
              </div>
            )}

            {isBollywoodView && (
              <div className="mb-4">
                <h3 className="text-base font-black text-white">Top Songs</h3>
              </div>
            )}

            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {visibleTracks.map((track) => (
                <MusicCard
                  key={track._id}
                  track={track}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playTrack={playTrack}
                  playableTracks={playableVisibleTracks}
                  handleOpenPlaylist={handleOpenPlaylist}
                  savedByUrl={savedByUrl}
                  savingId={savingId}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </section>

            {isBollywoodView && bollywoodAlbums.length > 0 && (
              <>
                <div className="mt-12 mb-4 flex items-end justify-between gap-4">
                  <h3 className="text-base font-black text-white">
                    Albums &amp; Playlists
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black">
                    {bollywoodAlbums.length} collections
                  </p>
                </div>

                <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {bollywoodAlbums.map((track) => (
                    <MusicCard
                      key={track._id}
                      track={track}
                      currentTrack={currentTrack}
                      isPlaying={isPlaying}
                      playTrack={playTrack}
                      playableTracks={playableVisibleTracks}
                      handleOpenPlaylist={handleOpenPlaylist}
                      savedByUrl={savedByUrl}
                      savingId={savingId}
                      toggleFavorite={toggleFavorite}
                      forceAlbum
                      accent="pink"
                    />
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Music;
