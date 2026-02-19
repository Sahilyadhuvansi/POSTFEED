import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    axios
      .get(`${apiUrl}/api/posts/feed`)
      .then((res) => setPosts(res.data.posts));
  }, []);

  return (
    <section className="feed-container">
      <nav className="navbar glass">
        <Link to="/" className="logo">
          PostFeed
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/create-post">Create</Link>
              <Link to="/profile" className="nav-profile">
                <img src={user.profilePic} alt="P" className="nav-avatar" />
                <span>{user.username}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <div className="feed-section">
        {posts.map((post) => (
          <div
            key={post._id}
            className={`post ${post.isSecret ? "secret-post" : ""}`}
            onClick={() => setSelectedImage(post.image)}
          >
            <div className="post-header">
              <img
                src={
                  post.user?.profilePic ||
                  "https://ik.imagekit.io/sanujii/default-profile.png"
                }
                alt="P"
                className="post-avatar"
              />
              <span className="post-username">
                {post.user?.username || "Anonymous"}
              </span>
              {post.isSecret && <span className="secret-badge">Secret</span>}
            </div>
            <img src={post.image} alt="" className="post-main-img" />
            <p className="post-caption">{post.caption}</p>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="modal-content">
            <img
              src={selectedImage}
              alt="Full Screen"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="close-btn"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Feed;
