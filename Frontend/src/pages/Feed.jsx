import React, { useState, useEffect } from "react";
import axios from "axios";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

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

  return (
    <div className="feed-wrapper">
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section for Logged In Users */}
        {user && (
          <div className="mb-12 rounded-xl border border-white/10 bg-gray-950/60 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                    {user.username}
                  </span>
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Discover what's new in your feed
                </p>
              </div>
              <div className="hidden sm:block text-3xl">👋</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="spinner-ring h-12 w-12 mx-auto"></div>
              <p className="text-gray-400 font-semibold">Loading posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="text-5xl">📝</div>
              <p className="text-gray-400 font-semibold">No posts yet</p>
              <p className="text-sm text-gray-500">
                Be the first to share your story
              </p>
            </div>
          </div>
        ) : (
          <div className="feed-grid">
            {posts.map((post) => (
              <article key={post._id} className="post-article">
                {/* Post Header */}
                <div className="post-header">
                  <div className="post-avatar-wrapper">
                    <img
                      src={
                        post.user?.profilePic ||
                        "https://ik.imagekit.io/sanujii/default-profile.png"
                      }
                      alt={post.user?.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-gray-200 truncate">
                      {post.user?.username || "Anonymous"}
                    </span>
                    {post.isSecret && (
                      <span className="secret-whisper-tag">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path>
                        </svg>
                        Secret Post
                      </span>
                    )}
                  </div>
                </div>

                {/* Post Image */}
                <div
                  className="post-image-container"
                  onClick={() => setSelectedImage(post.image)}
                >
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="post-image"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="rounded-full bg-white/20 backdrop-blur-md p-3 text-white">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4 space-y-3">
                  <p className="text-sm leading-relaxed text-gray-300 line-clamp-3 hover:line-clamp-none transition-all">
                    {post.caption}
                  </p>

                  {/* Post Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-white/5 pt-3">
                    <span className="flex items-center gap-1 hover:text-indigo-400 transition cursor-pointer">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 01-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                      </svg>
                      Like
                    </span>
                    <span className="flex items-center gap-1 hover:text-pink-400 transition cursor-pointer">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      Comment
                    </span>
                    <span className="flex items-center gap-1 hover:text-indigo-400 transition cursor-pointer">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M15 8a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path
                          fillRule="evenodd"
                          d="M0 8a8 8 0 1116 0A8 8 0 010 8zm16-6a6 6 0 11-12 0 6 6 0 0112 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      Share
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Modern Center Modal */}
      {selectedImage && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-box">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-h-[85vh] w-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="modal-close-btn"
              onClick={() => setSelectedImage(null)}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut to Close Modal */}
      {selectedImage && (
        <script>
          {`
            const handleEscape = (e) => {
              if (e.key === 'Escape') {
                setSelectedImage(null);
              }
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
          `}
        </script>
      )}
    </div>
  );
};

export default Feed;
