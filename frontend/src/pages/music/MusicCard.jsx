import { Play, Pause, ListMusic, Heart, Zap } from "lucide-react";

const MusicCard = ({
  track,
  currentTrack,
  isPlaying,
  playTrack,
  playableTracks,
  handleOpenPlaylist,
  savedByUrl,
  savingId,
  toggleFavorite,
  forceAlbum = false,
  accent = "indigo",
}) => {
  const isActive = currentTrack?._id === track._id;
  const isAlbum = forceAlbum || !!track.isPlaylist;
  const isSaved = !!savedByUrl[track.youtubeUrl];

  const accentClass =
    accent === "pink"
      ? "group-hover:text-pink-400"
      : "group-hover:text-indigo-400";

  return (
    <article
      className={`group rounded-2xl border p-3 transition-all duration-300 ${
        isActive
          ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_18px_40px_rgba(79,70,229,0.22)]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
      }`}
    >
      <button
        onClick={() => {
          if (isAlbum) {
            handleOpenPlaylist(track);
            return;
          }
          playTrack(track, playableTracks);
        }}
        className="relative w-full aspect-square overflow-hidden rounded-xl bg-neutral-900"
      >
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-black">
            <Zap className="w-10 h-10 text-neutral-700" />
          </div>
        )}

        <span className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-black/70 border border-white/25 flex items-center justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          {isActive && isPlaying ? (
            <Pause className="w-4 h-4 text-white fill-white" />
          ) : isAlbum ? (
            <ListMusic className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white fill-white ml-[1px]" />
          )}
        </span>
      </button>

      <div className="pt-3 px-1">
        <h3
          className={`text-sm font-bold text-white truncate transition-colors ${accentClass}`}
        >
          {track.title}
        </h3>
        <p className="mt-1 text-xs text-neutral-400 truncate">
          {isAlbum ? "Open album tracks" : "Track"}
        </p>
      </div>

      {!isAlbum && (
        <div className="pt-3 px-1 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(track);
            }}
            disabled={savingId === track._id}
            className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all disabled:opacity-50 ${
              isSaved
                ? "border-pink-500/50 bg-pink-500/20 text-pink-400"
                : "border-white/15 bg-white/5 text-neutral-500 hover:text-indigo-300 hover:border-indigo-400/40"
            }`}
            title={isSaved ? "Remove from favorites" : "Add to favorites"}
          >
            {savingId === track._id ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart
                className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`}
              />
            )}
          </button>
        </div>
      )}
    </article>
  );
};

export default MusicCard;
