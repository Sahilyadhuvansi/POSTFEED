import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setNewUsername(parsedUser.username);
      setBio(parsedUser.bio || "");
      setProfilePicPreview(parsedUser.profilePic);
    }
  }, [navigate]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setNewProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const res = await axios.put(`${apiUrl}/api/users/profile`, formData, {
        withCredentials: true,
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-gray-900">
        <div className="text-center">
          <div className="spinner-ring h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-400 font-semibold">Loading profile...</p>
        </div>
      </div>
    );

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        {/* Profile Banner */}
        <div className="profile-banner"></div>

        {/* Profile Content */}
        <div className="profile-info">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
            <div className="relative -mt-24">
              <div className="profile-avatar-large">
                <img
                  src={
                    profilePicPreview ||
                    user.profilePic ||
                    "https://ik.imagekit.io/sanujii/default-profile.png"
                  }
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-black text-white">
                {user.username}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Member since {new Date().getFullYear()}
              </p>
              {bio && (
                <p className="text-sm text-gray-300 mt-3 max-w-md">{bio}</p>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 sm:flex-none rounded-lg bg-indigo-600 hover:bg-indigo-700 px-6 py-2 text-sm font-bold text-white transition flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
                Edit
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500/10 hover:bg-red-500 border border-red-500/50 hover:border-red-500 px-6 py-2 text-sm font-bold text-red-500 hover:text-white transition flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1h12a1 1 0 110 2H4v12a1 1 0 001 1h4a1 1 0 110 2H3a1 1 0 01-1-1V3z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-lg border border-green-500/50 bg-green-500/10 text-green-400 text-sm font-medium flex items-start gap-3 animate-in fade-in">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-medium flex items-start gap-3">
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

          {/* Edit Form */}
          {isEditing && (
            <form
              onSubmit={handleUpdate}
              className="space-y-6 border-t border-white/10 pt-8"
            >
              {/* Profile Picture Upload */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">
                  Profile Picture
                </label>
                <div className="relative">
                  {profilePicPreview && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/15 bg-black/40 mx-auto">
                      <img
                        src={profilePicPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label className="mt-4 flex items-center justify-center w-full rounded-lg border-2 border-dashed border-white/20 hover:border-indigo-500/50 bg-black/40 hover:bg-indigo-500/5 cursor-pointer transition p-4">
                    <div className="text-center">
                      <svg
                        className="w-8 h-8 text-gray-500 mx-auto mb-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"></path>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400">
                        Change photo
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                    />
                  </label>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter your username"
                />
              </div>

              {/* Bio */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                  className="textarea-field h-24 resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-xs text-gray-500">
                    {bio.length}/160
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-white/10 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-submit flex-1"
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
                  className="flex-1 rounded-lg border border-white/20 hover:border-white/50 px-4 py-3 text-sm font-bold text-gray-300 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
