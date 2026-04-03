import { Link } from "react-router-dom";
import { LayoutGrid, Music, Plus, User, Heart, Send } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black pt-24 pb-12">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-16 mb-24">
          {/* Brand & Newsletter */}
          <div className="space-y-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
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
              <span className="text-xl font-black text-white italic tracking-tight uppercase">
                Music
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                  Feed
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-sm text-neutral-500 leading-relaxed font-medium">
              A minimalist space for high-impact visual expressions and musical
              discovery. Built for the modern creative.
            </p>
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="email"
                placeholder="Updates in your inbox"
                className="flex-1 bg-neutral-900 border border-white/5 rounded-full px-5 py-3 text-sm font-medium text-white placeholder-neutral-700 focus:outline-none focus:border-indigo-500/50"
              />
              <button className="p-3 bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Connect */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
              Explore
            </h3>
            <div className="space-y-4">
              <Link
                to="/music"
                className="flex items-center gap-3 text-sm font-bold text-neutral-400 hover:text-white transition-colors group"
              >
                <Music className="w-4 h-4 text-neutral-700 group-hover:text-pink-400 transition-colors" />{" "}
                Music
              </Link>
              <Link
                to="/feed"
                className="flex items-center gap-3 text-sm font-bold text-neutral-400 hover:text-white transition-colors group"
              >
                <LayoutGrid className="w-4 h-4 text-neutral-700 group-hover:text-indigo-400 transition-colors" />{" "}
                Feed
              </Link>
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
              Activity
            </h3>
            <div className="space-y-4">
              <Link
                to="/create-post"
                className="flex items-center gap-3 text-sm font-bold text-neutral-400 hover:text-white transition-colors group"
              >
                <Plus className="w-4 h-4 text-neutral-700 group-hover:text-indigo-400 transition-colors" />{" "}
                Express
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 text-sm font-bold text-neutral-400 hover:text-white transition-colors group"
              >
                <User className="w-4 h-4 text-neutral-700 group-hover:text-pink-400 transition-colors" />{" "}
                Universe
              </Link>
            </div>
          </div>

          {/* Community */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
              Company
            </h3>
            <div className="space-y-4">
              <Link
                to="#"
                className="block text-sm font-bold text-neutral-400 hover:text-white transition-colors"
              >
                Manifesto
              </Link>
              <Link
                to="#"
                className="block text-sm font-bold text-neutral-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            <p className="text-[10px] font-black text-neutral-700 uppercase tracking-widest leading-none">
              &copy; {currentYear} MusicFeed.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-[10px] font-black text-neutral-600 hover:text-white uppercase tracking-widest transition-colors"
            >
              Instagram
            </a>
            <a
              href="#"
              className="text-[10px] font-black text-neutral-600 hover:text-white uppercase tracking-widest transition-colors"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-[10px] font-black text-neutral-600 hover:text-white uppercase tracking-widest transition-colors"
            >
              Github
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
