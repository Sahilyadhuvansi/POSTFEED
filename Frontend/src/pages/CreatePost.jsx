import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("caption", caption);
    formData.append("isSecret", isSecret);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      await axios.post(`${apiUrl}/api/posts/create`, formData, {
        withCredentials: true,
      });
      navigate("/");
    } catch (err) {
      alert("Error creating post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="w-full max-w-xl space-y-8 rounded-3xl border border-white/5 bg-gray-950 p-10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white">
            Create a <span className="text-indigo-500">New Post</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Share your story or whisper a secret.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-6">
            <div className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/10 transition-all hover:border-indigo-500/50">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-white hover:text-black"
                  >
                    &times;
                  </button>
                </>
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-gray-400">
                    Upload Image
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                Caption
              </label>
              <textarea
                placeholder="What's on your mind?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
                className="textarea-field"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🤫</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-200">
                    Share as a Secret
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Your identity will be protected.
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-800 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none focus:ring-2 focus:ring-indigo-500"></div>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Creating Post..." : "Share Post"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
