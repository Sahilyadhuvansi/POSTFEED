import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const CreatePost = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!ALLOWED_IMAGE.includes(file.type)) {
        setError(
          `Unsupported image format (${file.type || "unknown"}). Please use JPG, PNG, WEBP, or GIF.`,
        );
        e.target.value = "";
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError(
          `Image is too large (${formatSize(file.size)}). Maximum size is 5MB.`,
        );
        e.target.value = "";
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!image && !caption.trim()) {
      setError("Please add a caption or an image.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    if (image) {
      formData.append("image", image);
    }
    formData.append("caption", caption);
    formData.append("isSecret", isSecret);

    try {
      await axios.post(`${API_URL}/api/posts/create`, formData);
      navigate("/");
    } catch (err) {
      let message = "Error creating post. Please try again.";

      if (err.response?.status === 401) {
        message = "You are not logged in. Please log in and try again.";
      } else if (err.response?.status === 413) {
        message =
          "Image is too large for the server. Please use an image under 4.5MB.";
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message?.includes("Network Error")) {
        message =
          "Network error. Check your internet connection and try again.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-950/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Share Your Story
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Create a post and share it with the world
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-medium flex items-start gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              ></path>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload */}
          <div className="space-y-3">
            <label
              htmlFor="post-image"
              className="text-xs font-bold uppercase tracking-widest text-gray-500 block"
            >
              📸 Upload Image{" "}
              <span className="text-gray-600 normal-case font-normal">
                (optional)
              </span>
            </label>
            <div className="group relative">
              {imagePreview ? (
                <div className="relative w-full rounded-xl overflow-hidden border border-white/15 bg-black">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-white hover:text-black transition"
                    aria-label="Remove image"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="post-image"
                  className="flex flex-col items-center justify-center w-full h-56 rounded-xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/5 cursor-pointer transition-all"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-gray-300">
                        Click to upload or drag and drop
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                    <input
                      id="post-image"
                      name="image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-3">
            <label
              htmlFor="post-caption"
              className="text-xs font-bold uppercase tracking-widest text-gray-500 block"
            >
              ✍️ Caption
            </label>
            <textarea
              id="post-caption"
              name="caption"
              placeholder="What's on your mind? Share your thoughts..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 h-32 resize-none"
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-500">
                {caption.length}/500
              </span>
            </div>
          </div>

          {/* Secret Post Toggle */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤫</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-200">
                    Post as Secret
                  </span>
                  <span className="text-xs text-gray-500">
                    Your identity stays anonymous
                  </span>
                </div>
              </div>
              <label
                htmlFor="post-secret"
                className="relative inline-flex cursor-pointer items-center"
              >
                <input
                  id="post-secret"
                  name="isSecret"
                  type="checkbox"
                  className="peer sr-only"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                />
                <div className="peer relative h-7 w-14 rounded-full bg-gray-700 after:absolute after:top-[3px] after:left-[3px] after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-pink-600 peer-checked:after:translate-x-7 peer-focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black"></div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!image && !caption.trim())}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Sharing your post...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"></path>
                </svg>
                Share Post
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
