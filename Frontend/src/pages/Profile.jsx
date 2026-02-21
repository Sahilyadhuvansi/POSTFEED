import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL, DEFAULT_AVATAR } from "../config";
import { usePageReady } from "../hooks/usePageReady";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Signal page readiness when user data is available
  usePageReady(!!user);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
      setBio(user.bio || "");
      setProfilePicPreview(user.profilePic);
    }
  }, [user]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(
          `Unsupported image format. Please use JPG, PNG, WEBP, or GIF.`,
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setError(`Image is too large (${sizeMB}MB). Maximum size is 5MB.`);
        return;
      }
      setNewProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.append("username", newUsername);
    formData.append("bio", bio);
    if (newProfilePic) formData.append("profilePic", newProfilePic);

    try {
      const res = await axios.put(`${API_URL}/api/users/profile`, formData);
      updateUser(res.data.user);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      let message = "Update failed. Please try again.";

      if (err.response?.status === 401) {
        message = "Your session has expired. Please log in again.";
      } else if (err.response?.status === 409) {
        message = "That username is already taken. Please choose another.";
      } else if (err.response?.status === 413) {
        message =
          "Profile picture is too large. Please use an image under 4.5MB.";
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.message?.includes("Network Error")) {
        message = "Network error. Check your internet connection.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Banner */}
      <div className="h-40 sm:h-52 w-full bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-pink-600/40"></div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
        {/* Profile Header */}
        <div className="relative -mt-16 sm:-mt-20 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar — Circle cropped */}
            <div
              onClick={() => isEditing && fileInputRef.current?.click()}
              className={`relative h-28 w-28 sm:h-32 sm:w-32 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[3px] shadow-xl shadow-black/50 ${isEditing ? "cursor-pointer hover:shadow-indigo-500/30" : ""}`}
            >
              <div className="h-full w-full rounded-full overflow-hidden bg-gray-900 ring-4 ring-black">
                <img
                  src={profilePicPreview || user.profilePic || DEFAULT_AVATAR}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR;
                  }}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              {isEditing && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
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
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
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
              onChange={handleProfilePicChange}
            />

            {/* Name & Info */}
            <div className="flex-1 text-center sm:text-left mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {user.username}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Member since {new Date().getFullYear()}
              </p>
              {bio && (
                <p className="text-sm text-gray-400 mt-2 max-w-md">{bio}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/10 hover:border-white/20 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                  />
                </svg>
                {isEditing ? "Cancel" : "Edit"}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500 px-5 py-2.5 text-sm font-semibold text-red-400 hover:text-white transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div className="mb-6 p-3.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium flex items-center gap-2.5">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-2.5">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="rounded-2xl border border-white/10 bg-gray-950/60 backdrop-blur-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 ml-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter username"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 ml-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 h-24 resize-none"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-gray-600">
                    {bio.length}/160
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNewUsername(user.username);
                    setBio(user.bio || "");
                    setProfilePicPreview(user.profilePic);
                  }}
                  className="flex-1 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white transition-all"
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
