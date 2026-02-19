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

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card glass">
        <div className="profile-header">
          <img
            src={user.profilePic}
            alt="Profile"
            className="profile-pic-large"
          />
          <h1>{user.username}</h1>
        </div>

        <form onSubmit={handleUpdate} className="profile-form">
          <label>Update Username</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />

          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="profile-textarea"
          />

          <label>Update Profile Picture</label>
          <input
            type="file"
            onChange={(e) => setNewProfilePic(e.target.files[0])}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
