import { useState } from "react";
import api from "../../services/api";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const useCreatePostController = ({ addToast, navigate }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [musicSearch, setMusicSearch] = useState("");
  const [musicResults, setMusicResults] = useState([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [attachedTrack, setAttachedTrack] = useState(null);

  const handleMusicSearch = async (e) => {
    e.preventDefault();
    if (!musicSearch.trim()) return;

    setIsSearchingMusic(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(musicSearch)}&type=video&key=${API_KEY}`,
      );
      const data = await response.json();
      const tracks = (data.items || []).map((item) => ({
        _id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        artist: { username: item.snippet.channelTitle },
      }));
      setMusicResults(tracks);
    } catch {
      addToast("Search failed. Check your API key.", "error");
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_IMAGE.includes(file.type)) {
      addToast("Unsupported format. Use JPG, PNG, WEBP, or GIF.", "error");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      addToast("Image too large. Max 5MB.", "error");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image && !caption.trim()) {
      addToast("Add a caption or an image to share your universe.", "info");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("caption", caption);
    formData.append("isSecret", isSecret);

    if (attachedTrack) {
      formData.append("youtubeUrl", attachedTrack.youtubeUrl);
      formData.append("youtubeTitle", attachedTrack.title);
      formData.append("youtubeThumb", attachedTrack.thumbnail);
    }

    try {
      await api.post("/posts/create", formData);
      addToast("Your expression has been broadcasted.", "success");
      navigate("/");
    } catch (err) {
      addToast(
        err.response?.data?.error || "Sharing failed. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    image,
    imagePreview,
    caption,
    setCaption,
    isSecret,
    setIsSecret,
    loading,
    showAIGenerator,
    setShowAIGenerator,
    musicSearch,
    setMusicSearch,
    musicResults,
    isSearchingMusic,
    attachedTrack,
    setAttachedTrack,
    handleMusicSearch,
    handleImageChange,
    clearImage,
    handleSubmit,
  };
};
