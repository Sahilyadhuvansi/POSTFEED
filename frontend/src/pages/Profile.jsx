import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { DEFAULT_AVATAR } from "../config";
import api from "../services/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [form, setForm] = useState({ username: "", bio: "" });
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setForm({ username: user.username || "", bio: user.bio || "" });
      setPreview(user.profilePic || null);
    }
  }, [user]);

  // Auto-clear success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
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
      else
        setError(
          err.response?.data?.error || "Update failed. Please try again.",
        );
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      <div className="h-40 sm:h-52 w-full bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-pink-600/40" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
        <div className="relative -mt-16 sm:-mt-20 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div
              onClick={() => isEditing && fileInputRef.current?.click()}
              className={`relative h-28 w-28 sm:h-32 sm:w-32 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[3px] shadow-xl ${isEditing ? "cursor-pointer" : ""}`}
            >
              <div className="h-full w-full rounded-full overflow-hidden bg-gray-900 ring-4 ring-black">
                <img
                  src={preview || DEFAULT_AVATAR}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR;
                  }}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              {isEditing && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {user.username}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Member since{" "}
                {new Date(user.createdAt || Date.now()).getFullYear()}
              </p>
              {user.bio && (
                <p className="text-sm text-gray-400 mt-2 max-w-md">
                  {user.bio}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500 px-5 py-2.5 text-sm font-semibold text-red-400 hover:text-white transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 p-3.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="rounded-2xl border border-white/10 bg-gray-950/60 backdrop-blur-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label
                  htmlFor="p-username"
                  className="block text-xs font-semibold text-gray-400 mb-2 ml-1"
                >
                  Username
                </label>
                <input
                  id="p-username"
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label
                  htmlFor="p-bio"
                  className="block text-xs font-semibold text-gray-400 mb-2 ml-1"
                >
                  Bio
                </label>
                <textarea
                  id="p-bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell the world about yourself..."
                  maxLength={160}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 h-24 resize-none"
                />
                <p className="text-right text-xs text-gray-600 mt-1">
                  {form.bio.length}/160
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
