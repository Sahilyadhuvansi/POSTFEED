import React, { useState, useEffect } from "react";
import axios from "axios";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  React.useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    axios
      .get(`${apiUrl}/api/posts/feed`)
      .then((res) => setPosts(res.data.posts));
  }, []);

  return (
    <section className="feed-container">
      <div className="feed-section">
        {posts.map((post) => (
          <div
            key={post._id}
            className="post"
            onClick={() => setSelectedImage(post.image)}
          >
            <img src={post.image} alt="" />
            <p>{post.caption}</p>
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
