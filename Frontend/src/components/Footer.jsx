import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12 mb-10">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500">
                <svg
                  className="h-3.5 w-3.5 text-white"
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
              <span className="text-sm font-extrabold text-white tracking-tight">
                POST
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                  FEED
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-sm text-gray-500 leading-relaxed">
              The modern way to share your world. Connect, express yourself, and
              discover amazing stories from our community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Quick Links
            </h3>
            <div className="space-y-2.5">
              <Link
                to="/"
                className="block text-sm text-gray-500 hover:text-white transition-colors"
              >
                Feed
              </Link>
              <Link
                to="/music"
                className="block text-sm text-gray-500 hover:text-white transition-colors"
              >
                Music
              </Link>
              <Link
                to="/create-post"
                className="block text-sm text-gray-500 hover:text-white transition-colors"
              >
                Create Post
              </Link>
              <Link
                to="/profile"
                className="block text-sm text-gray-500 hover:text-white transition-colors"
              >
                Profile
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Legal
            </h3>
            <div className="space-y-2.5">
              <a
                href="#"
                className="block text-sm text-gray-500 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="block text-sm text-gray-500 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="block text-sm text-gray-500 hover:text-white transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {currentYear} POSTFEED. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="p-2 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20v-7.21H5.93V9.98h2.36V8.41c0-2.33 1.43-3.61 3.48-3.61.99 0 1.84.07 2.09.1v2.42h-1.44c-1.13 0-1.35.53-1.35 1.32v1.73h2.7l-.35 2.81h-2.35V20z" />
              </svg>
            </a>
            <a
              href="#"
              className="p-2 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.97 4.97 0 00-.09-.91A7.72 7.72 0 0023 3z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
