import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { DEFAULT_AVATAR } from "../../config";
import { PostSkeletonLoader } from "../../components/SkeletonLoader";
import { Heart, LayoutGrid, Send } from "lucide-react";
import { useMusic } from "../../features/music/MusicContext";
import { optimizeImageUrl, IMAGE_SIZES } from "../../utils/image-optimization";
import FeedPostModal from "./FeedPostModal";
import { useFeedController } from "./useFeedController";

/**
 * PRODUCTION FEED v2.6.0
 * Deep clean, O(1) engagement, and automated pagination
 */
const Feed = () => {
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusic();
  const {
    posts,
    selectedPost,
    setSelectedPost,
    loading,
    hasMore,
    observerTarget,
    handleLike,
    handleDelete,
  } = useFeedController({ user });

  if (loading && posts.length === 0) return <PostSkeletonLoader />;

  return (
    <div className="min-h-screen bg-black select-none">
      <div className="mx-auto max-w-[1400px] px-6 pt-24 pb-24">
        {user && (
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-10 gap-8">
            <div className="flex items-center gap-6">
              <div className="relative group p-1 rounded-full glass-dark border-white/5">
                <div className="h-20 w-20 rounded-full overflow-hidden border border-white/10 ring-4 ring-white/5">
                  <img
                    src={user.profilePic || DEFAULT_AVATAR}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-black shadow-xl animate-pulse" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  Systems Online,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                    {user.username}
                  </span>
                </h1>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />{" "}
                    Authorized
                  </span>
                  <span className="text-[9px] font-black text-neutral-600 tracking-[0.3em] uppercase">
                    MF-PROD.S2
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/create-post"
              className="btn-primary flex items-center gap-3 px-10 py-4 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest transition-all hover:bg-neutral-200 active:scale-95 shadow-2xl"
            >
              <Send className="w-4 h-4" /> Broadcast vibe
            </Link>
          </header>
        )}

        {posts.length === 0 ? (
          <section className="flex min-h-[50vh] flex-col items-center justify-center p-20 glass rounded-[60px] border-white/5 animate-fade-in">
            <LayoutGrid className="w-16 h-16 text-neutral-800 mb-6" />
            <h2 className="text-2xl font-black text-white mb-2 italic mb-8">
              The grid is silent.
            </h2>
            <Link
              to="/create-post"
              className="px-12 py-5 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform"
            >
              Initialize Stream
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {posts.map((post) => (
              <article
                key={post._id}
                className="group relative cursor-pointer overflow-hidden rounded-[40px] glass-dark aspect-square border-white/5 transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                onClick={() => setSelectedPost(post)}
              >
                {post.image ? (
                  <img
                    src={optimizeImageUrl(post.image, IMAGE_SIZES.THUMBNAIL)}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-white/[0.01] p-10 text-center">
                    <p className="text-sm text-neutral-500 font-black italic tracking-tight line-clamp-4 group-hover:text-white transition-colors capitalize">
                      "{post.caption}"
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.user?.profilePic || DEFAULT_AVATAR}
                        className="h-8 w-8 rounded-full border border-white/20"
                        alt=""
                      />
                      <span className="text-[10px] font-black text-white uppercase italic tracking-widest">
                        @{post.user?.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleLike(e, post._id)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${post.likes?.includes(user?._id) ? "bg-pink-500 border-pink-500 text-white" : "glass border-white/10 text-white"}`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${post.likes?.includes(user?._id) ? "fill-white" : ""}`}
                        />
                        <span className="text-[9px] font-black">
                          {post.likeCount || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {hasMore && (
              <div
                ref={observerTarget}
                className="col-span-full py-32 flex justify-center"
              >
                <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <FeedPostModal
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        user={user}
        handleDelete={handleDelete}
        handleLike={handleLike}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        playTrack={playTrack}
      />
    </div>
  );
};

export default Feed;
