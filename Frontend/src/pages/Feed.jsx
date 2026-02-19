import React, { useState, useEffect } from "react";
import axios from "axios";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    axios
      .get(`${apiUrl}/api/posts/feed`)
      .then((res) => setPosts(res.data.posts));
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="feed-grid">
          {posts.map((post) => (
            <article key={post._id} className="post-article">
              <div className="flex items-center gap-3 p-4">
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
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-200">
                    {post.user?.username || "Anonymous"}
                  </span>
                  {post.isSecret && (
                    <span className="secret-whisper-tag">🤫 Whisper</span>
                  )}
                </div>
              </div>

              <div
                className="post-image-container"
                onClick={() => setSelectedImage(post.image)}
              >
                <img
                  src={post.image}
                  alt={post.caption}
                  className="post-image"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="p-4">
                <p className="text-sm leading-relaxed text-gray-400 line-clamp-3">
                  {post.caption}
                </p>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Modern Center Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
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
    </div>
  );
};

export default Feed;
