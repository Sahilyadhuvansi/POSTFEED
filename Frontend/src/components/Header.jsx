import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="header-main">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-pink-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative px-3 py-1 bg-black rounded-lg">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-pink-500 bg-clip-text text-transparent">
                POSTFEED
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-8 flex-1 justify-center">
          <Link to="/" className="nav-link-base flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
            Feed
          </Link>
          {user && (
            <Link
              to="/create-post"
              className="nav-link-base flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Create
            </Link>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="hidden sm:flex items-center gap-4">
              <Link
                to="/profile"
                className="flex items-center gap-2 group p-2 rounded-lg hover:bg-white/5 transition"
              >
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
                <span className="text-sm font-bold text-gray-200 group-hover:text-white transition">
                  {user.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn-logout flex items-center gap-2"
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
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              <Link to="/login" className="nav-link-base">
                Login
              </Link>
              <Link to="/register" className="btn-join">
                Join free
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-white/10 transition"
          >
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  mobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl">
          <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white"
            >
              Feed
            </Link>
            {user ? (
              <>
                <Link
                  to="/create-post"
                  className="block px-3 py-2 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white"
                >
                  Create Post
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold"
                >
                  Join Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
