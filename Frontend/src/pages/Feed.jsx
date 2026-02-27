import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL, DEFAULT_AVATAR } from "../config";
import { PostSkeletonLoader } from "../components/SkeletonLoader";
import { useApiCache } from "../hooks/useApiCache";
import { MoreVertical, Trash2 } from "lucide-react";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);
  const { user } = useAuth();
  const { getFromCache, setCache } = useApiCache();
  const observerTarget = useRef(null);
  const postMenuRef = useRef(null);

  const POSTS_PER_PAGE = 10;

  // --- DATA FETCHING & CACHING ---
  useEffect(() => {
    const cacheKey = "feed_posts_page_1";
    const cached = getFromCache(cacheKey);

    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosts(cached.posts);
      setPage(cached.page);
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/api/posts/feed?page=1&limit=${POSTS_PER_PAGE}`)
      .then((res) => {
        const newPosts = res.data.posts || [];
        setPosts(newPosts);
        setLoading(false);
        setPage(1);
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setCache(cacheKey, { posts: newPosts, page: 1 });
      })
      .catch((err) => {
        console.error("Feed Error:", err.response?.data?.error || err.message);
        setLoading(false);
      });
  }, [getFromCache, setCache]);

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

  // --- MODAL & MENU HANDLERS ---
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      setSelectedPost(null);
    }
  }, []);

  useEffect(() => {
    if (selectedPost) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedPost, handleKeyDown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      const message =
        error.response?.status === 403
          ? "You don't have permission to delete this post."
          : error.response?.data?.error || "Failed to delete post.";
      alert(message);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu ? null : selectedPost._id);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5 lg:px-6 pt-6 pb-4">
        {user && (
          <div className="mb-6 flex items-center gap-4">
            <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px]">
              <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                <img
                  src={user.profilePic || DEFAULT_AVATAR}
                  alt=""
                  className="h-full w-full object-cover rounded-full"
                />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Welcome,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                  {user.username}
                </span>
              </h1>
              <p className="text-xs text-gray-500">Your feed is ready</p>
            </div>
          </div>
        )}

        {loading ? (
          <PostSkeletonLoader />
        ) : posts.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-5xl">📷</div>
              <p className="text-gray-400 font-semibold">No posts yet</p>
              <p className="text-xs text-gray-600">
                Be the first to share something
              </p>
            </div>
          </div>
        ) : (
          /* ========== IMAGE GRID ========== */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-900 aspect-square"
                onClick={() => setSelectedPost(post)}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.caption}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-pink-900/40 p-4">
                    <p className="text-sm text-gray-300 text-center line-clamp-6 font-medium leading-relaxed">
                      {post.caption}
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 p-3 sm:p-4 w-full hidden sm:flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <img
                    src={post.user?.profilePic || DEFAULT_AVATAR}
                    alt={post.user?.username}
                    className="h-8 w-8 rounded-full object-cover bg-gray-800"
                  />
                  <div>
                    <p className="text-xs font-bold text-white truncate">
                      {post.user?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {post.caption}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <div
                ref={observerTarget}
                className="col-span-2 sm:col-span-3 lg:col-span-4 py-8 flex justify-center"
              >
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 mx-auto spinner-ring" />
                  <p className="text-xs text-gray-500">Loading more posts...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== FULLSCREEN MODAL ========== */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
              onClick={() => setSelectedPost(null)}
              aria-label="Close"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {selectedPost.image ? (
              <img
                src={selectedPost.image}
                alt="Preview"
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
            ) : (
              <div className="w-full rounded-xl bg-gray-900 border border-white/10 p-8 flex items-center justify-center min-h-[200px]">
                <p className="text-lg text-gray-200 text-center leading-relaxed">
                  {selectedPost.caption}
                </p>
              </div>
            )}

            {/* Post Info Below Image */}
            <div className="mt-4 flex items-start gap-3">
              <img
                src={selectedPost.user?.profilePic || DEFAULT_AVATAR}
                alt=""
                className="h-10 w-10 rounded-full object-cover bg-gray-800"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  {selectedPost.user?.username || "Anonymous"}
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  {selectedPost.caption}
                </p>
              </div>

              {/* 3-dot menu in modal */}
              {user && String(user._id) === String(selectedPost.user?._id) && (
                <div className="relative flex-shrink-0" ref={postMenuRef}>
                  <button
                    onClick={toggleMenu}
                    className="p-2 text-gray-400 hover:text-white"
                    aria-label="Post options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {activeMenu === selectedPost._id && (
                    <div className="absolute right-0 top-full mt-2 w-40 rounded-lg bg-gray-800 border border-white/10 shadow-xl z-10">
                      <button
                        onClick={(e) => handleDeletePost(e, selectedPost._id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Post</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
