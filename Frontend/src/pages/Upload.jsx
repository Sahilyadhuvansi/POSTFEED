import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  Music,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const Upload = () => {
  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      setStatus({ type: "error", message: "Please select an audio file" });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("title", title);
    formData.append("audioFile", audioFile);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    try {
      await axios.post(`${apiUrl}/api/music`, formData);
      setStatus({ type: "success", message: "Music uploaded successfully!" });
      setTimeout(() => navigate("/music"), 2000);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Upload failed",
      });
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
          <div className="flex justify-center mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/25">
              <UploadIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Upload Music
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Share your sound with the world
          </p>
        </div>

        {/* Status Message */}
        {status.message && (
          <div
            className={`mb-6 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
              status.type === "success"
                ? "border border-green-500/30 bg-green-500/10 text-green-400"
                : "border border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Track Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 ml-1">
              Track Title
            </label>
            <input
              type="text"
              placeholder="e.g., Midnight City"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Audio File */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 ml-1">
              Audio File
            </label>
            <label
              className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                audioFile
                  ? "border-indigo-500/50 bg-indigo-500/5"
                  : "border-white/15 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/5"
              }`}
            >
              <Music className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm font-medium text-gray-300">
                {audioFile ? audioFile.name : "Click to select audio file"}
              </span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setAudioFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 ml-1">
              Thumbnail{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <label
              className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                thumbnail
                  ? "border-indigo-500/50 bg-indigo-500/5"
                  : "border-white/15 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/5"
              }`}
            >
              <Music className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm font-medium text-gray-300">
                {thumbnail ? thumbnail.name : "Click to select thumbnail"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setThumbnail(e.target.files[0])}
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              "Publish Track"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
