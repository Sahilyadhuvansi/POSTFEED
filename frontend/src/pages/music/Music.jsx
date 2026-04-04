import { useEffect } from "react";
import { useMusic } from "../../features/music/MusicContext";
import { useLocation } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { Disc } from "lucide-react";
import { MusicSkeleton } from "../../components/SkeletonLoader";
import MusicCard from "./MusicCard";
import ApiKeyRequired from "./ApiKeyRequired";
import MusicBrowseControls from "./MusicBrowseControls";
import { useMusicBrowser } from "./useMusicBrowser";

const Music = () => {
  const { currentTrack, playTrack, isPlaying } = useMusic();
  const { addToast } = useToast();
  const location = useLocation();

  const {
    loading,
    activeGenre,
    searchQuery,
    setSearchQuery,
    isSearching,
    apiKeyMissing,
    savingId,
    playlistMeta,
    setPlaylistMeta,
    savedByUrl,
    bollywoodAlbums,
    showFavoritesOnly,
    setShowFavoritesOnly,
    runSearch,
    toggleFavorite,
    handleGenreClick,
    handleOpenPlaylist,
    visibleTracks,
    playableVisibleTracks,
    isBollywoodView,
    activeGenreLabel,
  } = useMusicBrowser({ addToast });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const playId = params.get("play");
    if (playId && playableVisibleTracks.length > 0) {
      const track = playableVisibleTracks.find((t) => t._id === playId);
      if (track) playTrack(track, playableVisibleTracks);
    }
  }, [location.search, playableVisibleTracks, playTrack]);

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
