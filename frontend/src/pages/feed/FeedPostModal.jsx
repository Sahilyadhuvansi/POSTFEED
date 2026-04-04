import {
  Trash2,
  Heart,
  MessageCircle,
  Share2,
  X,
  Music,
  Play,
  Pause,
} from "lucide-react";
import { DEFAULT_AVATAR } from "../../config";
import { normalizeYoutubeUrl } from "../../utils/youtube";

const FeedPostModal = ({
  selectedPost,
  setSelectedPost,
  user,
  handleDelete,
  handleLike,
  currentTrack,
  isPlaying,
  togglePlay,
  playTrack,
}) => {
  if (!selectedPost) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in p-4 sm:p-12"
      onClick={() => setSelectedPost(null)}
    >
      <div
        className="relative bg-black w-full max-w-6xl h-full sm:h-auto sm:max-h-[85vh] grid grid-cols-1 lg:grid-cols-[1.2fr_400px] gap-px overflow-hidden sm:rounded-[64px] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-8 right-8 z-[110] p-4 glass rounded-full text-white hover:rotate-90 transition-all"
          onClick={() => setSelectedPost(null)}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-center bg-neutral-900/10">
          {selectedPost.image ? (
            <img
              src={selectedPost.image}
              alt=""
              className="w-full h-full object-contain sm:rounded-[50px] p-2"
            />
          ) : (
            <div className="p-20 text-center">
              <p className="text-4xl font-black text-white italic leading-tight">
                "{selectedPost.caption}"
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col h-full bg-black">
          <header className="p-10 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={selectedPost.user?.profilePic || DEFAULT_AVATAR}
                className="h-12 w-12 rounded-full ring-2 ring-indigo-500/20"
                alt=""
              />
              <div>
                <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">
                  @{selectedPost.user?.username}
                </h3>
                <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mt-1">
                  Primary Feed Source
                </p>
              </div>
            </div>
            {user?._id === selectedPost.user?._id && (
              <button
                onClick={(e) => handleDelete(e, selectedPost._id)}
                className="p-3 rounded-2xl glass-dark border-white/5 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </header>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
            <p className="text-sm text-neutral-400 font-medium leading-loose italic lowercase tracking-tight select-text opacity-80">
              {selectedPost.caption}
            </p>

            {selectedPost.youtubeUrl && (
              <div className="p-8 rounded-[40px] glass-dark border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                  <Music className="w-4 h-4 text-indigo-400" />{" "}
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    Atmospheric Vibe
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedPost.youtubeThumb}
                    className="w-16 h-16 rounded-2xl object-cover"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black text-white uppercase truncate tracking-tight">
                      {selectedPost.youtubeTitle}
                    </h4>
                    <button
                      onClick={() => {
                        const normalizedUrl = normalizeYoutubeUrl(
                          selectedPost.youtubeUrl,
                        );
                        return currentTrack?.youtubeUrl === normalizedUrl
                          ? togglePlay()
                          : playTrack({
                              _id: selectedPost._id + "v",
                              title: selectedPost.youtubeTitle,
                              youtubeUrl: normalizedUrl,
                              thumbnail: selectedPost.youtubeThumb,
                            });
                      }}
                      className="mt-3 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]"
                    >
                      {isPlaying &&
                      normalizeYoutubeUrl(currentTrack?.youtubeUrl) ===
                        normalizeYoutubeUrl(selectedPost.youtubeUrl) ? (
                        <>
                          <Pause className="w-3 h-3 fill-indigo-400" /> Silence
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-indigo-400" /> Sync
                          Frequency
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="p-10 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-8 mb-10">
              <button
                onClick={(e) => handleLike(e, selectedPost._id)}
                className={`transition-all hover:scale-110 ${selectedPost.likes?.includes(user?._id) ? "text-pink-500" : "text-neutral-500"}`}
              >
                <Heart
                  className={`w-8 h-8 ${selectedPost.likes?.includes(user?._id) ? "fill-pink-500" : ""}`}
                />
              </button>
              <button className="text-neutral-500 hover:text-white transition-all hover:scale-110">
                <MessageCircle className="w-8 h-8" />
              </button>
              <button className="text-neutral-500 hover:text-white transition-all hover:scale-110">
                <Share2 className="w-8 h-8" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl glass text-center border-white/5">
                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                  Pulse Count
                </p>
                <p className="text-xl font-black text-white">
                  {selectedPost.likeCount || 0}
                </p>
              </div>
              <div className="p-5 rounded-3xl glass text-center border-white/5">
                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                  Global Views
                </p>
                <p className="text-xl font-black text-white">
                  {(selectedPost.viewCount || 0) + 1}
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default FeedPostModal;
