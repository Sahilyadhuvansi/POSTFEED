import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    axios
      .get(`${apiUrl}/api/posts/feed`)
      .then((res) => {
        setPosts(res.data.posts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Escape key to close modal
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      setSelectedImage(null);
      setSelectedPost(null);
    }
  }, []);

  useEffect(() => {
    if (selectedImage) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage, handleKeyDown]);

  const openPost = (post) => {
    setSelectedImage(post.image || "");
    setSelectedPost(post);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5 lg:px-6 pt-6 pb-4">
        {user && (
          <div className="mb-6 flex items-center gap-4">
            <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px]">
              <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
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

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center space-y-3">
              <div className="spinner-ring h-10 w-10 mx-auto"></div>
              <p className="text-sm text-gray-500 font-medium">Loading...</p>
            </div>
          </div>
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
                onClick={() => openPost(post)}
              >
                {/* Image or Text Placeholder */}
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

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 sm:p-4">
                  {/* Username */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={
                        post.user?.profilePic ||
                        "https://www.gravatar.com/avatar/?d=mp&f=y&s=200"
                      }
                      alt=""
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-white/30"
                    />
                    <span className="text-xs font-semibold text-white truncate">
                      {post.user?.username || "Anonymous"}
                    </span>
                    {post.isSecret && (
                      <span className="ml-auto flex items-center gap-0.5 text-[10px] text-amber-400 font-medium bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                        <svg
                          className="w-2.5 h-2.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                        </svg>
                        Secret
                      </span>
                    )}
                  </div>

                  {/* Caption Preview */}
                  <p className="text-[11px] leading-snug text-gray-300 line-clamp-2">
                    {post.caption}
                  </p>

                  {/* Action Icons */}
                  <div className="flex items-center gap-3 mt-2 text-white/70">
                    <svg
                      className="w-4 h-4 hover:text-red-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <svg
                      className="w-4 h-4 hover:text-blue-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <svg
                      className="w-4 h-4 hover:text-green-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Always-visible subtle gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== FULLSCREEN MODAL ========== */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => {
            setSelectedImage(null);
            setSelectedPost(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
              onClick={() => {
                setSelectedImage(null);
                setSelectedPost(null);
              }}
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

            {/* Image or Text */}
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
            ) : (
              <div className="w-full rounded-xl bg-gray-900 border border-white/10 p-8 flex items-center justify-center min-h-[200px]">
                <p className="text-lg text-gray-200 text-center leading-relaxed">
                  {selectedPost?.caption}
                </p>
              </div>
            )}

            {/* Post Info Below Image */}
            {selectedPost && (
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={
                    selectedPost.user?.profilePic ||
                    "https://www.gravatar.com/avatar/?d=mp&f=y&s=200"
                  }
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedPost.user?.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {selectedPost.caption}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
