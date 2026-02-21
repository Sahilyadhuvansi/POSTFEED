import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Music, Upload } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-white"
      : "text-gray-400 hover:text-white";

  const activeDot = (path) =>
    location.pathname === path
      ? "absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-gradient-to-r from-indigo-400 to-pink-400"
      : "hidden";

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.27 3.13a1 1 0 01.95-1.32h15.56a1 1 0 01.95 1.32L18 12m-12 0v6a2 2 0 002 2h8a2 2 0 002-2v-6"
              />
            </svg>
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">
            POST
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              FEED
            </span>
          </span>
        </Link>

        {/* ── Center Nav (desktop) ── */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            to="/"
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/")}`}
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"
              />
            </svg>
            Feed
            <span className={activeDot("/")} />
          </Link>

          <Link
            to="/music"
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/music")}`}
          >
            <Music className="w-[18px] h-[18px]" />
            Music
            <span className={activeDot("/music")} />
          </Link>

          {user && (
            <>
              <Link
                to="/create-post"
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/create-post")}`}
              >
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create
                <span className={activeDot("/create-post")} />
              </Link>

              <Link
                to="/upload"
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/upload")}`}
              >
                <Upload className="w-[18px] h-[18px]" />
                Upload
                <span className={activeDot("/upload")} />
              </Link>

              <Link
                to="/profile"
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/profile")}`}
              >
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
                <span className={activeDot("/profile")} />
              </Link>
            </>
          )}
        </div>

        {/* ── Right Section (desktop) ── */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              {/* Avatar */}
              <Link to="/profile" className="group flex items-center gap-2">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[1.5px]">
                  <img
                    src={
                      user.profilePic ||
                      "https://ik.imagekit.io/sanujii/default-profile.png"
                    }
                    alt={user.username}
                    className="h-full w-full rounded-full object-cover bg-black"
                  />
                </div>
                <span className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors hidden lg:block">
                  {user.username}
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
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
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-1.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* ── Mobile Dropdown ── */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-80 border-t border-white/[0.06]" : "max-h-0"
        }`}
      >
        <div className="px-4 py-3 space-y-1 bg-black/95 backdrop-blur-xl">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"
              />
            </svg>
            Feed
          </Link>

          <Link
            to="/music"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition"
          >
            <Music className="w-4 h-4" />
            Music
          </Link>

          {user ? (
            <>
              <Link
                to="/create-post"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Post
              </Link>

              <Link
                to="/upload"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition"
              >
                <Upload className="w-4 h-4" />
                Upload Music
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </Link>
              <div className="pt-1 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
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
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition"
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                  />
                </svg>
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-3 py-2.5 text-sm font-bold text-white hover:opacity-90 transition"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
