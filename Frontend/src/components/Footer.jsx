import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-main">
      <div className="footer-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="inline-block mb-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative px-3 py-1 bg-black rounded-lg">
                  <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-pink-500 bg-clip-text text-transparent">
                    POSTFEED
                  </span>
                </div>
              </div>
            </Link>
            <p className="max-w-xs text-sm text-gray-400 leading-relaxed">
              The modern way to share your world. Connect, express yourself, and
              discover amazing stories from our community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-4">
              Quick Links
            </h3>
            <div className="space-y-2">
              <Link to="/" className="footer-link text-gray-400 text-sm">
                Home Feed
              </Link>
              <Link
                to="/create-post"
                className="footer-link text-gray-400 text-sm"
              >
                Create Post
              </Link>
              <Link to="/profile" className="footer-link text-gray-400 text-sm">
                My Profile
              </Link>
              <a href="#" className="footer-link text-gray-400 text-sm">
                Help Center
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-4">
              Legal
            </h3>
            <div className="space-y-2">
              <a href="#" className="footer-link text-gray-400 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="footer-link text-gray-400 text-sm">
                Terms of Service
              </a>
              <a href="#" className="footer-link text-gray-400 text-sm">
                Cookie Policy
              </a>
              <a href="#" className="footer-link text-gray-400 text-sm">
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10"></div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
            © {currentYear} POSTFEED CORP. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20v-7.21H5.93V9.98h2.36V8.41c0-2.33 1.43-3.61 3.48-3.61.99 0 1.84.07 2.09.1v2.42h-1.44c-1.13 0-1.35.53-1.35 1.32v1.73h2.7l-.35 2.81h-2.35V20z"></path>
              </svg>
            </a>
            <a
              href="#"
              className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-8a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z"></path>
              </svg>
            </a>
            <a
              href="#"
              className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 11-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
