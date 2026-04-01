import { ArrowLeft, Music as MusicIcon, Search } from "lucide-react";
import { GENRES } from "./constants";

const MusicBrowseControls = ({
  tracksCount,
  searchQuery,
  setSearchQuery,
  isSearching,
  showFavoritesOnly,
  setShowFavoritesOnly,
  activeGenre,
  handleGenreClick,
  playlistMeta,
  setPlaylistMeta,
  runSearch,
}) => {
  return (
    <>
      <div className="mb-10 border-b border-white/5 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl glass border-white/10">
              <MusicIcon className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white italic tracking-tighter">
            Sonic
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              Universe
            </span>
          </h1>
        </div>
        <div className="glass px-8 py-5 rounded-[32px] border-white/5 text-center min-w-[140px]">
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
            Items
          </p>
          <p className="text-2xl font-black text-white">
            {tracksCount}
            <span className="text-xs text-indigo-400 ml-1">+</span>
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-neutral-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Bollywood, pop, artist, song name…"
          className="w-full glass rounded-[24px] border border-white/5 bg-white/[0.03] pl-14 pr-6 py-5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-6 flex items-center text-neutral-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
          >
            Clear
          </button>
        )}
      </div>

      {!isSearching && (
        <div className="flex gap-2 flex-wrap mb-10">
          <button
            onClick={() => {
              setShowFavoritesOnly((prev) => !prev);
              setSearchQuery("");
              setPlaylistMeta(null);
            }}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              showFavoritesOnly
                ? "bg-pink-500 text-white shadow-[0_0_24px_rgba(236,72,153,0.35)]"
                : "glass border border-white/5 text-neutral-500 hover:text-white hover:border-white/10"
            }`}
          >
            Favorites
          </button>
          {GENRES.map((g, idx) => (
            <button
              key={g.label}
              onClick={() => handleGenreClick(idx)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeGenre === idx
                  ? "bg-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.4)]"
                  : "glass border border-white/5 text-neutral-500 hover:text-white hover:border-white/10"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-8">
          Search: &quot;{searchQuery}&quot;
        </p>
      )}

      {playlistMeta && (
        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-white/5 glass px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-black">
              Album / Playlist
            </p>
            <h3 className="text-sm text-white font-black truncate mt-1">
              {playlistMeta.title}
            </h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest truncate mt-1">
              {playlistMeta.artist}
            </p>
          </div>
          <button
            onClick={() => {
              setPlaylistMeta(null);
              runSearch(searchQuery.trim() || GENRES[activeGenre].term);
            }}
            className="px-4 py-2 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>
      )}
    </>
  );
};

export default MusicBrowseControls;
