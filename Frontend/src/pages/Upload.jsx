import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  Music,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { API_URL, IMAGEKIT_UPLOAD_URL } from "../config";
import { useApiCache } from "../hooks/useApiCache";
import { parseBlob } from "music-metadata-browser";

const Upload = () => {
  const [title, setTitle] = useState("");
  const [audioFiles, setAudioFiles] = useState([]);
  const [isAutoExtractedMap, setIsAutoExtractedMap] = useState({});
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailURL, setThumbnailURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const navigate = useNavigate();
  const { setCache } = useApiCache();

  const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_AUDIO = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/webm",
    "audio/flac",
    "audio/aac",
  ];
  const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleAudioChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = [];
    const autoMap = {};

    for (const file of files) {
      if (
        !ALLOWED_AUDIO.includes(file.type) &&
        !file.name.match(/\.(mp3|wav|ogg|m4a|webm|flac|aac)$/i)
      ) {
        continue;
      }

      if (file.size > MAX_AUDIO_SIZE) {
        continue;
      }

      validFiles.push(file);

      // Try extracting cover (only to note whether it exists)
      try {
        const metadata = await parseBlob(file);
        autoMap[file.name] = !!metadata?.common?.picture?.length;
      } catch {
        autoMap[file.name] = false;
      }
    }

    if (!validFiles.length) {
      setStatus({ type: "error", message: "No valid audio files selected." });
      e.target.value = "";
      return;
    }

    setAudioFiles(validFiles);
    setIsAutoExtractedMap(autoMap);

    // If exactly one file selected and it has embedded art, extract and set thumbnail
    if (validFiles.length === 1) {
      const fileTitle = validFiles[0].name.replace(/\.[^/.]+$/, "");
      setTitle(fileTitle);

      if (autoMap[validFiles[0].name]) {
        try {
          const meta = await parseBlob(validFiles[0]);
          const picture = meta.common.picture[0];
          const blob = new Blob([picture.data], { type: picture.format });
          const ext = picture.format?.split("/")[1] || "jpg";
          const coverFile = new File([blob], `cover_${Date.now()}.${ext}`, {
            type: picture.format,
          });
          if (coverFile.size <= MAX_IMAGE_SIZE) {
            setThumbnail(coverFile);
          }
        } catch (err) {
          console.warn("Auto-extract thumbnail failed:", err);
        }
      }
    } else if (validFiles.length > 1) {
      setTitle("");
    }

    setStatus({ type: "", message: "" });
  };

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailURL(null);
      return;
    }

    // Create a data URL (base64) for the image preview to avoid CSP blob: restrictions
    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailURL(reader.result);
    };
    reader.onerror = () => {
      setThumbnailURL(null);
    };
    reader.readAsDataURL(thumbnail);

    return () => {
      try {
        reader.abort();
      } catch {
        // ignore
      }
    };
  }, [thumbnail]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_IMAGE.includes(file.type)) {
      setStatus({
        type: "error",
        message: `Unsupported image format. Please use JPG, PNG, WEBP, or GIF.`,
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setStatus({
        type: "error",
        message: `Thumbnail is too large (${formatSize(file.size)}). Maximum size is 5MB.`,
      });
      e.target.value = "";
      return;
    }

    setThumbnail(file);
    setStatus({ type: "", message: "" });
  };

  // Upload a file directly to ImageKit from the browser
  const uploadToImageKit = async (file, authParams) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", `music_${Date.now()}_${file.name}`);
    formData.append("folder", "postfeed");
    formData.append("publicKey", authParams.publicKey);
    formData.append("signature", authParams.signature);
    formData.append("expire", authParams.expire);
    formData.append("token", authParams.token);

    const res = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "ImageKit upload failed");
    }

    return res.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioFiles.length) {
      setStatus({ type: "error", message: "Please select audio files" });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      for (const file of audioFiles) {
        try {
          const title = file.name.replace(/\.[^/.]+$/, "");

          // Get auth
          const { data: authParams } = await axios.get(
            `${API_URL}/api/music/imagekit-auth`,
          );

          // Upload audio
          const audioResult = await uploadToImageKit(file, authParams);

          // Extract cover and upload if present
          let thumbnailResult = null;
          try {
            const metadata = await parseBlob(file);
            if (metadata.common.picture?.length) {
              const picture = metadata.common.picture[0];
              const blob = new Blob([picture.data], { type: picture.format });
              const ext = picture.format?.split("/")[1] || "jpg";
              const coverFile = new File([blob], `cover_${Date.now()}.${ext}`, {
                type: picture.format,
              });

              const { data: thumbAuth } = await axios.get(
                `${API_URL}/api/music/imagekit-auth`,
              );

              thumbnailResult = await uploadToImageKit(coverFile, thumbAuth);
            }
          } catch (thumbErr) {
            console.warn(
              `Thumbnail extraction/upload failed for ${file.name}:`,
              thumbErr,
            );
          }

          // Save in DB
          await axios.post(`${API_URL}/api/music`, {
            title,
            audioUrl: audioResult.url,
            audioFileId: audioResult.fileId,
            thumbnailUrl: thumbnailResult?.url || null,
            thumbnailFileId: thumbnailResult?.fileId || null,
          });
          // After upload, clear cache and refetch music list
          setCache("music_tracks_page_1", null);
          setCache("music_tracks_page_2", null);
        } catch (fileErr) {
          console.error(`Upload failed for ${file.name}:`, fileErr);
          throw new Error(
            fileErr?.response?.data?.error ||
              fileErr.message ||
              `Upload failed for ${file.name}`,
          );
        }
      }

      setStatus({ type: "success", message: "All songs uploaded!" });
      setTimeout(() => navigate("/music"), 2000);
    } catch (error) {
      console.error("Upload flow error:", error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Upload failed. Please try again.";
      setStatus({ type: "error", message });
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
        <div className="text-center mb-8" id="upload-page">
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
                : status.type === "error"
                  ? "border border-red-500/30 bg-red-500/10 text-red-400"
                  : "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : status.type === "error" ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin flex-shrink-0"></div>
            )}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Audio File */}
          <div>
            <label
              htmlFor="upload-audio"
              className="block text-xs font-semibold text-gray-400 mb-2 ml-1"
            >
              Audio File
            </label>
            <label
              htmlFor="upload-audio"
              className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                audioFiles.length > 0
                  ? "border-indigo-500/50 bg-indigo-500/5"
                  : "border-white/15 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/5"
              }`}
            >
              <Music className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm font-medium text-gray-300">
                {audioFiles.length
                  ? `${audioFiles.length} file(s) selected`
                  : "Click to select audio file"}
              </span>
              <span className="text-xs text-gray-600 mt-1">
                MP3, WAV, OGG, M4A, FLAC — max 25MB
              </span>
              <input
                id="upload-audio"
                name="audio"
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={handleAudioChange}
              />
            </label>
          </div>

          {/* Track Title */}
          {audioFiles.length > 0 && (
            <div>
              <label
                htmlFor="upload-title"
                className="block text-xs font-semibold text-gray-400 mb-2 ml-1"
              >
                Track Title
              </label>
              <input
                id="upload-title"
                name="title"
                type="text"
                placeholder="e.g., Midnight City"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required={audioFiles.length === 1}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          {/* Thumbnail */}
          <div>
            <label
              htmlFor="upload-thumbnail"
              className="block text-xs font-semibold text-gray-400 mb-2 ml-1"
            >
              Thumbnail{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <label
              htmlFor="upload-thumbnail"
              className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                thumbnail
                  ? "border-indigo-500/50 bg-indigo-500/5"
                  : "border-white/15 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/5"
              }`}
            >
              <Music className="w-8 h-8 text-gray-500 mb-2" />
              {thumbnailURL ? (
                <div className="flex items-center gap-4">
                  <img
                    src={thumbnailURL}
                    alt="thumbnail preview"
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="text-sm text-gray-300">
                    <div>
                      {thumbnail.name} ({formatSize(thumbnail.size)})
                      {audioFiles.length === 1 &&
                      isAutoExtractedMap[audioFiles[0].name]
                        ? " • Auto-extracted"
                        : ""}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-300">
                  Click to select thumbnail
                </span>
              )}
              <span className="text-xs text-gray-600 mt-1">
                JPG, PNG, WEBP — max 5MB
              </span>
              <input
                id="upload-thumbnail"
                name="thumbnail"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange}
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
