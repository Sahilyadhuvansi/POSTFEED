import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { API_URL, DEFAULT_AVATAR } from "../../config";
import { PostSkeletonLoader } from "../../components/SkeletonLoader";
import { useApiCache } from "../../hooks/useApiCache";
import { MoreVertical, Trash2, Heart, MessageCircle, Share2, Eye, X, LayoutGrid } from "lucide-react";

const POSTS_PER_PAGE = 12;

const Feed = () => {
  const { user } = useAuth();
  const { getFromCache, setCache } = useApiCache();
  const observerTarget = useRef(null);
  const postMenuRef = useRef(null);

  // --- COLD START / CACHE INIT ---
  const initialCached = getFromCache("feed_posts_page_1");

  const [posts, setPosts] = useState(initialCached?.posts || []);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(!initialCached);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialCached?.page || 1);
  const [activeMenu, setActiveMenu] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    // If we have cached data, don't trigger initial fetch
    if (initialCached) return;

    axios
      .get(`${API_URL}/api/posts/feed?page=1&limit=${POSTS_PER_PAGE}`)
      .then((res) => {
        const newPosts = res.data.posts || [];
        setPosts(newPosts);
        setLoading(false);
        setPage(1);
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setCache("feed_posts_page_1", { posts: newPosts, page: 1 });
      })
      .catch((err) => {
        console.error("Feed Error:", err.response?.data?.error || err.message);
        setLoading(false);
      });
  }, [getFromCache, setCache, initialCached]);

  const loadMorePosts = useCallback(() => {
    const nextPage = page + 1;
    const cacheKey = `feed_posts_page_${nextPage}`;
    const cached = getFromCache(cacheKey);

    if (cached) {
      setPosts((prev) => [...prev, ...cached.posts]);
      setPage(nextPage);
      setHasMore(cached.posts.length === POSTS_PER_PAGE);
      return;
    }

    axios
      .get(`${API_URL}/api/posts/feed?page=${nextPage}&limit=${POSTS_PER_PAGE}`)
      .then((res) => {
        const newPosts = res.data.posts || [];
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setCache(cacheKey, { posts: newPosts });
      })
      .catch((err) => {
        console.error("Load more error:", err.message);
      });
  }, [page, getFromCache, setCache]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMorePosts]);

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`);
      setPosts(posts.filter((p) => p._id !== postId));
      if (selectedPost?._id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete post.");
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu ? null : selectedPost._id);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[1400px] px-6 pt-12 pb-24">
        {/* Welcome Header */}
        {user && (
          <div className="mb-12 flex items-end justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px] transition-transform hover:rotate-3">
                <div className="h-full w-full rounded-[22px] bg-black p-1">
                  <img
                    src={user.profilePic || DEFAULT_AVATAR}
                    alt=""
                    className="h-full w-full object-cover rounded-[18px]"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                  Hey, 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 italic">
                    {user.username}
                  </span>
                </h1>
                <p className="text-sm font-medium text-neutral-500 tracking-wide uppercase">Your creative universe is active</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Global Feed</p>
                <p className="text-xl font-black text-white">{posts.length}+ <span className="text-xs text-neutral-600 font-bold uppercase ml-1">Posts</span></p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <PostSkeletonLoader />
        ) : posts.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-8 h-8 text-neutral-700" />
              </div>
              <p className="text-xl font-bold text-neutral-400">No expressions found</p>
              <Link to="/create-post" className="inline-block px-8 py-3 bg-white text-black text-sm font-black rounded-full hover:bg-neutral-200 transition-colors">
                Share First Post
              </Link>
            </div>
          </div>
        ) : (
          /* ========== IMAGE GRID ========== */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="group relative cursor-pointer overflow-hidden rounded-[20px] bg-neutral-900 aspect-square border border-white/5"
                onClick={() => setSelectedPost(post)}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.caption}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 text-center">
                    <p className="text-sm text-neutral-300 font-semibold line-clamp-4 leading-relaxed italic">
                      "{post.caption}"
                    </p>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex flex-col justify-between p-4">
                  <div className="flex justify-end">
                    <div className="p-2 rounded-full bg-white/10 text-white transition-transform group-hover:scale-110">
                      <Eye className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
                  
                  <div className="space-y-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-2">
                       <img
                        src={post.user?.profilePic || DEFAULT_AVATAR}
                        alt=""
                        className="h-6 w-6 rounded-full border border-white/20 object-cover"
                      />
                      <p className="text-xs font-black text-white tracking-wide">@{post.user?.username || "anon"}</p>
                    </div>
                    <p className="text-[10px] text-neutral-300 line-clamp-2 leading-relaxed font-medium">
                      {post.caption}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div
                ref={observerTarget}
                className="col-span-full py-20 flex flex-col items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full border-t-2 border-indigo-500 animate-spin" />
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em]">Extending Feed</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== FULLSCREEN MODAL ========== */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-[8px] sm:p-6"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative bg-neutral-900 w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden sm:rounded-[40px] border border-white/5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Mobile */}
             <button
              className="absolute top-4 right-4 z-[70] p-2 bg-black/50 text-white rounded-full sm:hidden"
              onClick={() => setSelectedPost(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content Side */}
            <div className="relative flex items-center justify-center bg-black/40 overflow-hidden">
              {selectedPost.image ? (
                <img
                  src={selectedPost.image}
                  alt=""
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-12 text-center">
                  <p className="text-2xl font-black text-white italic">"{selectedPost.caption}"</p>
                </div>
              )}
            </div>

            {/* Sidebar Side */}
            <div className="flex flex-col h-full bg-neutral-900 border-l border-white/5">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                   <img
                    src={selectedPost.user?.profilePic || DEFAULT_AVATAR}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover p-0.5 border-2 border-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-black text-white">@{selectedPost.user?.username || "Anonymous"}</p>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Original Creator</p>
                  </div>
                </div>
                
                {user && String(user._id) === String(selectedPost.user?._id) && (
                  <div className="relative" ref={postMenuRef}>
                    <button
                      onClick={toggleMenu}
                      className="p-2 rounded-full hover:bg-white/5 transition-colors text-neutral-400"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenu === selectedPost._id && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-neutral-800 border border-white/10 shadow-2xl p-2 z-10">
                        <button
                          onClick={(e) => handleDeletePost(e, selectedPost._id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Expression
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Scrollable Context */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                   <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                    {selectedPost.caption}
                  </p>
                </div>
              </div>

              {/* Interactions Bar */}
              <div className="p-6 border-t border-white/5 bg-black/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button className="text-neutral-400 hover:text-white transition-colors"><Heart className="w-6 h-6" /></button>
                    <button className="text-neutral-400 hover:text-white transition-colors"><MessageCircle className="w-6 h-6" /></button>
                    <button className="text-neutral-400 hover:text-white transition-colors"><Share2 className="w-6 h-6" /></button>
                  </div>
                </div>
                <div className="bg-white/5 rounded-full px-5 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center cursor-not-allowed">
                  Interactions Restricted
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
