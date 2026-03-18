import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { Music, Upload, Plus, User, LogOut, LayoutGrid, Menu, X } from "lucide-react";
import { DEFAULT_AVATAR } from "../config";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-white bg-white/5"
      : "text-neutral-400 hover:text-white hover:bg-white/5";

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? "bg-black/80 backdrop-blur-xl border-neutral-800 py-2" 
          : "bg-transparent border-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
            <svg
              className="h-5 w-5 text-white"
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
          <span className="text-xl font-black tracking-tight text-white uppercase italic">
            Post
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              Feed
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive("/")}`}>
            <LayoutGrid className="w-4 h-4" />
            Feed
          </Link>
          <Link to="/music" className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive("/music")}`}>
            <Music className="w-4 h-4" />
            Music
          </Link>
          {user && (
            <>
              <Link to="/create-post" className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive("/create-post")}`}>
                <Plus className="w-4 h-4" />
                Create
              </Link>
              <Link to="/upload" className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive("/upload")}`}>
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-6">
              <Link to="/profile" className="flex items-center gap-3 p-1 pl-3 rounded-full border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-colors">
                <span className="hidden lg:block text-xs font-bold text-neutral-300">
                  {user.username}
                </span>
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500/50 p-0.5 shadow-md">
                  <img
                    src={user.profilePic || DEFAULT_AVATAR}
                    alt={user.username}
                    className="h-full w-full rounded-full object-cover bg-neutral-900"
                  />
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="px-5 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors">
                Log in
              </Link>
              <Link to="/register" className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-black hover:bg-neutral-200 transition-colors">
                Sign up free
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-neutral-800 transition-all duration-300 ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
        <div className="p-6 space-y-4">
          <Link to="/" onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive("/")}`}>
            <LayoutGrid className="w-5 h-5" /> Feed
          </Link>
          <Link to="/music" onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive("/music")}`}>
            <Music className="w-5 h-5" /> Music
          </Link>
          {user ? (
            <>
              <Link to="/create-post" onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive("/create-post")}`}>
                <Plus className="w-5 h-5" /> Create Post
              </Link>
              <Link to="/upload" onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive("/upload")}`}>
                <Upload className="w-5 h-5" /> Upload Music
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${isActive("/profile")}`}>
                <User className="w-5 h-5" /> Profile
              </Link>
              <button 
                onClick={() => { logout(); navigate("/login"); }}
                className="flex items-center gap-4 p-4 w-full rounded-2xl text-lg font-bold text-red-400 bg-red-400/10"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-4 text-center text-lg font-bold text-neutral-400">Log in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="py-4 text-center text-lg font-bold bg-white text-black rounded-2xl">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
