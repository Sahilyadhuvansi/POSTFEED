import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="main-header glass">
      <div className="header-container">
        <Link to="/" className="logo-section">
          <span className="logo-icon">🤫</span>
          <span className="logo-text">
            Whisper<span className="accent">Secrets</span>
          </span>
        </Link>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">
            Feed
          </Link>
          {user ? (
            <>
              <Link to="/create-post" className="nav-link">
                Share Secret
              </Link>
              <Link to="/profile" className="nav-user">
                <img
                  src={
                    user.profilePic ||
                    "https://ik.imagekit.io/sanujii/default-profile.png"
                  }
                  alt="Profile"
                  className="nav-avatar"
                />
                <span className="nav-username">{user.username}</span>
              </Link>
              <button onClick={handleLogout} className="logout-btn-nav">
                Logout
              </button>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn-primary-small">
                Join Free
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
