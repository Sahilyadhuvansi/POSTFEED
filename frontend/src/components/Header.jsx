import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  Music,
  Plus,
  User,
  LogOut,
  LayoutGrid,
  Menu,
  X,
  Sparkles,
  Send,
} from "lucide-react";
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
      ? "text-white bg-white/10 shadow-[0_4px_24px_rgba(255,255,255,0.1)]"
      : "text-neutral-500 hover:text-white hover:bg-white/5";

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? "glass-dark border-white/5 py-3 shadow-2xl"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
        {/* Branding */}
        <Link
          to="/"
          className="flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className="relative group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all group-hover:rotate-[15deg]">
              <img 
                src="/favicon.png" 
                alt="Logo" 
                className="h-6 w-6 object-contain"
              />
            </div>
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">
            Music
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              Feed
            </span>
          </span>
        </Link>

        {/* Navigation Core */}
        <div className="hidden md:flex items-center gap-2 p-1 rounded-full glass border-white/5 bg-white/5">
          <Link
            to="/music"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isActive("/") || isActive("/music") ? "text-white bg-white/10 shadow-[0_4px_24px_rgba(255,255,255,0.1)]" : "text-neutral-500 hover:text-white hover:bg-white/5"}`}
          >
            <Music className="w-3.5 h-3.5" />
            Vibes
          </Link>
          <Link
            to="/feed"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isActive("/feed")}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Feed
          </Link>
          {user && (
            <>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <Link
                to="/create-post"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isActive("/create-post")}`}
              >
                <Plus className="w-3.5 h-3.5" />
                Broadcast
              </Link>
            </>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-5">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-1 rounded-full glass hover:bg-white/10 transition-colors border-white/5"
              >
                <div className="h-9 w-9 rounded-full border border-white/10 p-0.5 overflow-hidden">
                  <img
                    src={user.profilePic || DEFAULT_AVATAR}
                    alt={user.username}
                    className="h-full w-full rounded-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-3 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-all active:scale-90"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              <Link
                to="/login"
                className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                Identify
              </Link>
              <Link
                to="/register"
                className="px-7 py-3 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-[0_8px_32px_rgba(255,255,255,0.1)] active:scale-95"
              >
                Initialize Hub
              </Link>
            </div>
          )}

          {/* Mobile Controller */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-3 rounded-2xl glass border-white/5 text-neutral-400 hover:text-white transition-all"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nexus Overlay */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 glass-dark border-b border-white/5 transition-all duration-500 ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"}`}
      >
        <div className="p-8 space-y-3">
          <Link
            to="/music"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-4 p-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] ${isActive("/") || isActive("/music") ? "text-white bg-white/10 shadow-[0_4px_24px_rgba(255,255,255,0.1)]" : "text-neutral-500 hover:text-white hover:bg-white/5"}`}
          >
            <Music className="w-5 h-5" /> Frequency
          </Link>
          <Link
            to="/feed"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-4 p-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] ${isActive("/feed")}`}
          >
            <LayoutGrid className="w-5 h-5" /> Stream
          </Link>
          {user ? (
            <>
              <Link
                to="/create-post"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-4 p-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] ${isActive("/create-post")}`}
              >
                <Plus className="w-5 h-5" /> New Expression
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-4 p-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] ${isActive("/profile")}`}
              >
                <User className="w-5 h-5" /> Personal Hub
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex items-center gap-4 p-5 w-full rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-red-400 bg-red-400/5 mt-4"
              >
                <LogOut className="w-5 h-5" /> Deactivate Session
              </button>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 pt-6">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="p-5 text-center text-xs font-black uppercase tracking-[0.2em] border border-white/5 rounded-2xl"
              >
                Identity
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="p-5 text-center text-xs font-black uppercase tracking-[0.2em] bg-white text-black rounded-2xl shadow-xl"
              >
                Init Hub
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
