import React, { useState } from "react";
import axios from "axios";

const CreatePost = () => {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSecret, setIsSecret] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", image);
    formData.append("caption", caption);
    formData.append("isSecret", isSecret);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const res = await axios.post(`${apiUrl}/api/posts/create`, formData, {
      withCredentials: true,
    });
    console.log(res.data);
  };

  return (
    <section className="create-post-section">
      <h1>Create Post</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          required
        />
        <input
          type="text"
          name="caption"
          placeholder="Enter Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          required
        />
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="isSecret"
            checked={isSecret}
            onChange={(e) => setIsSecret(e.target.checked)}
          />
          <label htmlFor="isSecret">Share as a Secret</label>
        </div>
        <button type="submit">Submit</button>
      </form>
    </section>
  );
};

export default CreatePost;
