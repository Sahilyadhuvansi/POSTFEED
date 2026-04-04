import { Music, Search, Play, Pause, Plus } from "lucide-react";

const CreatePostMusicSection = ({
  attachedTrack,
  setAttachedTrack,
  currentTrack,
  isPlaying,
  togglePlay,
  playTrack,
  musicSearch,
  setMusicSearch,
  handleMusicSearch,
  isSearchingMusic,
  musicResults,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] flex items-center gap-2">
          <Music className="w-3 h-3" /> Musical Resonance
        </label>
        {attachedTrack && (
          <button
            type="button"
            onClick={() => setAttachedTrack(null)}
            className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:text-pink-400 transition-colors"
          >
            Remove vibe
          </button>
        )}
      </div>

      {attachedTrack ? (
        <div className="relative group p-4 rounded-[28px] border border-white/5 bg-white/5 flex items-center gap-4">
          <img
            src={attachedTrack.thumbnail}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black text-white truncate uppercase tracking-tighter italic">
              {attachedTrack.title}
            </h3>
            <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">
              {attachedTrack.artist?.username}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (currentTrack?.youtubeUrl === attachedTrack.youtubeUrl) {
                togglePlay();
              } else {
                playTrack(attachedTrack);
              }
            }}
            className="p-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all shadow-xl"
          >
            {isPlaying &&
            currentTrack?.youtubeUrl === attachedTrack.youtubeUrl ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for the perfect vibe on YouTube..."
              value={musicSearch}
              onChange={(e) => setMusicSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMusicSearch(e)}
              className="w-full bg-white/5 border border-white/5 rounded-[24px] pl-12 pr-6 py-4 text-sm font-medium text-white placeholder-neutral-700 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <button
              type="button"
              onClick={handleMusicSearch}
              disabled={isSearchingMusic || !musicSearch.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 px-4 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              {isSearchingMusic ? "Searching..." : "Find"}
            </button>
          </div>

          {musicResults.length > 0 && (
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {musicResults.map((track) => (
                <div
                  key={track._id}
                  onClick={() => setAttachedTrack(track)}
                  className="p-3 rounded-2xl border border-white/5 bg-white/0 hover:bg-white/5 cursor-pointer flex items-center gap-4 transition-all group"
                >
                  <img
                    src={track.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">
                      {track.title}
                    </p>
                    <p className="text-[9px] text-neutral-600 font-bold uppercase mt-0.5">
                      {track.artist?.username}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-neutral-800 group-hover:text-indigo-400 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatePostMusicSection;
