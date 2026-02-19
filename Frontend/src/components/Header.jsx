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
    <header className="header-main">
      <div className="header-container">
        <Link to="/" className="flex items-center space-x-2">
          <span className="logo-text">POSTFEED</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className="nav-link-base">
            Feed
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/create-post" className="hidden nav-link-base sm:block">
                Create
              </Link>
              <Link to="/profile" className="flex items-center gap-2 group">
                <div className="user-avatar-ring">
                  <img
                    src={
                      user.profilePic ||
                      "https://ik.imagekit.io/sanujii/default-profile.png"
                    }
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="hidden text-sm font-bold text-gray-200 sm:inline-block">
                  {user.username}
                </span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="nav-link-base">
                Login
              </Link>
              <Link to="/register" className="btn-join">
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
