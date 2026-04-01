import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { DEFAULT_AVATAR } from "../config";
import api from "../services/api";
import { PostSkeletonLoader } from "../components/SkeletonLoader";
import { useApiCache } from "../hooks/useApiCache";
import { useToast } from "../components/ui/Toast";
import {
  MoreVertical,
  Trash2,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  X,
  LayoutGrid,
  Sparkles,
  Send,
} from "lucide-react";

const POSTS_PER_PAGE = 12;

const Feed = () => {
  const { user } = useAuth();
  const { getFromCache, setCache } = useApiCache();
  const { addToast } = useToast();
  const observerTarget = useRef(null);
  const postMenuRef = useRef(null);

  const initialCached = getFromCache("feed_page_1");

  const [posts, setPosts] = useState(initialCached?.posts || []);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(!initialCached);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);

  // ─── Initial Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialCached) return;
    api
      .get(`/posts/feed?page=1&limit=${POSTS_PER_PAGE}`)
      .then((res) => {
        const newPosts = res.data.posts || [];
        setPosts(newPosts);
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setCache("feed_page_1", { posts: newPosts });
      })
      .catch((err) => {
        // Render free tier cold starts can take 50s. If it's a timeout/network error, show a softer message
        const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
        addToast(
          isTimeout
            ? "Server is waking up… refresh in 30 seconds."
            : err.response?.data?.error || "Neural link failed. Feed offline.",
          isTimeout ? "info" : "error",
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load More (Infinite Scroll) ───────────────────────────────────────────
  const loadMorePosts = useCallback(() => {
    const nextPage = page + 1;
    const cacheKey = `feed_page_${nextPage}`;
    const cached = getFromCache(cacheKey);

    if (cached) {
      setPosts((prev) => [...prev, ...cached.posts]);
      setPage(nextPage);
      setHasMore(cached.posts.length === POSTS_PER_PAGE);
      return;
    }

    api
      .get(`/posts/feed?page=${nextPage}&limit=${POSTS_PER_PAGE}`)
      .then((res) => {
        const newPosts = res.data.posts || [];
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setCache(cacheKey, { posts: newPosts });
      })
      .catch((err) => console.error("Expansion error:", err.message));
  }, [page, getFromCache, setCache]);

  // ─── Intersection Observer ─────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) loadMorePosts();
      },
      { threshold: 0.1 },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMorePosts]);

  // ─── Close menu on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (postMenuRef.current && !postMenuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Delete Post ───────────────────────────────────────────────────────────
  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm("Broadcast deletion? This cannot be undone.")) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      if (selectedPost?._id === postId) setSelectedPost(null);
      setActiveMenu(null);
      addToast("Post erased from the stream.", "success");
    } catch (err) {
      addToast(
        err.response?.data?.error || "Deletion protocol failed.",
        "error",
      );
    }
  };

  if (loading) return <PostSkeletonLoader />;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 pt-16 pb-24">
        {/* Dynamic Header */}
        {user && (
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-10 gap-8">
            <div className="flex items-center gap-6">
              <div className="relative group p-1 rounded-[32px] glass-dark border-white/5">
                <div className="h-20 w-20 rounded-[28px] overflow-hidden border border-white/10">
                  <img
                    src={user.profilePic || DEFAULT_AVATAR}
                    alt=""
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-125"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full glass border-white/10 flex items-center justify-center shadow-2xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">
                  Welcome,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 italic">
                    {user.username}
                  </span>
                </h1>
                <p className="mt-2 text-xs font-black text-neutral-500 tracking-[0.3em] uppercase opacity-70">
                  Neural hub status: Operational
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="glass px-6 py-4 rounded-3xl border-white/5 text-center min-w-[120px]">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                  Global Connect
                </p>
                <p className="text-2xl font-black text-white">
                  {posts.length}
                  <span className="text-xs text-indigo-400 ml-1">+</span>
                </p>
              </div>
              <Link
                to="/create-post"
                className="flex items-center gap-3 glass-dark hover:bg-white text-white hover:text-black px-8 py-4 rounded-3xl border-white/5 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Broadcast
                </span>
              </Link>
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center p-12 glass rounded-[40px] border-white/5 mt-8">
            <div className="relative mb-8">
              <div className="w-24 h-24 glass-dark rounded-full flex items-center justify-center animate-pulse">
                <LayoutGrid className="w-10 h-10 text-neutral-800" />
              </div>
              <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 italic">
              The void is silent
            </h2>
            <p className="text-sm font-medium text-neutral-500 mb-8 uppercase tracking-widest">
              Start the ripple in the stream
            </p>
            <Link
              to="/create-post"
              className="group relative overflow-hidden px-10 py-4 bg-white text-black text-xs font-black rounded-2xl transition-all hover:bg-neutral-200 uppercase tracking-widest flex items-center gap-3"
            >
              Initial Expression
              <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="group relative cursor-pointer overflow-hidden rounded-[32px] glass-dark aspect-square border-white/5 transition-all duration-500 hover:shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
                onClick={() => setSelectedPost(post)}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.caption}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-white/[0.02] p-8 text-center transition-colors group-hover:bg-white/[0.05]">
                    <p className="text-sm text-neutral-400 font-bold leading-relaxed italic group-hover:text-white">
                      "{post.caption}"
                    </p>
                  </div>
                )}

                {/* Overlay Context */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                  <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-700 delay-75 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-white/20 overflow-hidden">
                        <img
                          src={post.user?.profilePic || DEFAULT_AVATAR}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-[10px] font-black text-white tracking-widest uppercase italic">
                        @{post.user?.username || "unknown-user"}
                      </p>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-medium line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 lowercase italic tracking-tight">
                      {post.caption}
                    </p>
                  </div>
                </div>

                {/* Quick Action Float */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  <div className="glass p-2.5 rounded-2xl border-white/10 backdrop-blur-3xl">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div
                ref={observerTarget}
                className="col-span-full py-24 flex flex-col items-center gap-6"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
                </div>
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.5em] animate-pulse">
                  Expanding Stream
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Neural Post Modal ── */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-2xl sm:p-8"
          onClick={() => {
            setSelectedPost(null);
            setActiveMenu(null);
          }}
        >
          <div
            className="relative bg-black w-full max-w-6xl h-full sm:h-auto sm:max-h-[90vh] grid grid-cols-1 lg:grid-cols-[1.2fr_400px] overflow-hidden sm:rounded-[48px] border border-white/5 shadow-[0_64px_128px_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-6 right-6 z-[70] p-3 glass border-white/10 text-white rounded-[20px] transition-all hover:bg-white hover:text-black hover:rotate-90"
              onClick={() => setSelectedPost(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Visual Focus */}
            <div className="relative flex items-center justify-center bg-neutral-900/40 p-1">
              {selectedPost.image ? (
                <img
                  src={selectedPost.image}
                  alt=""
                  className="w-full h-full object-contain sm:rounded-[40px] shadow-2xl"
                />
              ) : (
                <div className="p-20 text-center">
                  <p className="text-3xl font-black text-white italic tracking-tight leading-relaxed">
                    "{selectedPost.caption}"
                  </p>
                </div>
              )}
            </div>

            {/* Intel Sidebar */}
            <div className="flex flex-col h-full bg-black border-l border-white/5">
              <div className="flex items-center justify-between p-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl border-2 border-indigo-500/30 p-0.5 shadow-xl">
                    <img
                      src={selectedPost.user?.profilePic || DEFAULT_AVATAR}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-widest uppercase italic">
                      @{selectedPost.user?.username || "Identity Unknown"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">
                        Primary Hub
                      </p>
                    </div>
                  </div>
                </div>
                {user &&
                  String(user._id) === String(selectedPost.user?._id) && (
                    <div className="relative" ref={postMenuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu ? null : selectedPost._id);
                        }}
                        className="p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-neutral-400"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {activeMenu === selectedPost._id && (
                        <div className="absolute right-0 top-full mt-3 w-56 rounded-3xl glass-dark border-white/10 shadow-2xl p-2.5 z-10 animate-fade-in-down">
                          <button
                            onClick={(e) =>
                              handleDeletePost(e, selectedPost._id)
                            }
                            className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-400/5 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Entry
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Data Space */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <p className="text-[13px] text-neutral-400 font-medium leading-loose whitespace-pre-wrap lowercase tracking-tight italic select-text">
                  {selectedPost.caption}
                </p>
              </div>

              {/* Interaction Cluster */}
              <div className="p-8 glass border-t border-white/5">
                <div className="flex items-center gap-6 mb-8">
                  <button className="text-neutral-500 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                    <Heart className="w-6 h-6" />
                  </button>
                  <button className="text-neutral-500 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button className="text-neutral-500 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl px-6 py-4 text-[10px] font-black text-neutral-600 uppercase tracking-widest text-center glass">
                  Feedback frequency locked
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
