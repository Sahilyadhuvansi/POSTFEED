import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export const useProfileController = ({ user, updateUser }) => {
  const [form, setForm] = useState({ username: "", bio: "" });
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [universe, setUniverse] = useState([]);
  const [loadingUniverse, setLoadingUniverse] = useState(true);
  const fileInputRef = useRef(null);

  const fetchUniverse = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoadingUniverse(true);
      const res = await api.get("/music");
      setUniverse(res.data.musics.filter((m) => m.artist?._id === user?._id));
    } catch (err) {
      console.error("Universe sync failed:", err);
    } finally {
      setLoadingUniverse(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user) {
      setForm({ username: user.username || "", bio: user.bio || "" });
      setPreview(user.profilePic || null);
      fetchUniverse();
    }
  }, [user, fetchUniverse]);

  const handleDeleteTrack = async (trackId) => {
    if (!window.confirm("Remove this vibe from your universe?")) return;
    try {
      await api.delete(`/music/${trackId}`);
      setUniverse((prev) => prev.filter((t) => t._id !== trackId));
    } catch {
      setError("Failed to remove track.");
    }
  };

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported format. Use JPG, PNG, WEBP, or GIF.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(
        `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is ${MAX_SIZE_MB}MB.`,
      );
      return;
    }

    setNewProfilePic(file);
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.append("username", form.username);
    formData.append("bio", form.bio);
    if (newProfilePic) formData.append("profilePic", newProfilePic);

    try {
      const res = await api.put("/users/profile", formData);
      updateUser(res.data.user);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setNewProfilePic(null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError("Session expired. Please log in again.");
      else if (status === 409) setError("That username is already taken.");
      else if (status === 413) setError("Image too large. Max 4.5MB.");
      else {
        setError(
          err.response?.data?.error || "Update failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({ username: user?.username || "", bio: user?.bio || "" });
    setPreview(user?.profilePic || null);
    setNewProfilePic(null);
    setError("");
  };

  return {
    form,
    setForm,
    preview,
    loading,
    error,
    success,
    isEditing,
    setIsEditing,
    universe,
    loadingUniverse,
    fileInputRef,
    handleDeleteTrack,
    handleFileChange,
    handleUpdate,
    handleCancelEdit,
  };
};
