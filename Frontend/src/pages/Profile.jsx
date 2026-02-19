import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
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
    }
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
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
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/5 bg-gray-950 shadow-2xl">
        <div className="profile-banner">
          <div className="absolute -bottom-12 left-8">
            <div className="profile-avatar-large">
              <img
                src={user.profilePic}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="px-8 pt-16 pb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {user.username}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                Member since {new Date().getUTCFullYear()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full bg-red-500/10 px-6 py-2 text-xs font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
            >
              Logout
            </button>
          </div>

          <form onSubmit={handleUpdate} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="textarea-field"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewProfilePic(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
