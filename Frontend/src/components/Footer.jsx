import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer-main">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-10 sm:flex-row">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link to="/" className="logo-text">
              POSTFEED
            </Link>
            <p className="mt-3 max-w-xs text-sm font-medium text-gray-500">
              The modern way to share your world and whispers in complete
              privacy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-gray-400 sm:justify-end">
            <Link to="/" className="hover:text-white transition-colors">
              Feed
            </Link>
            <Link
              to="/create-post"
              className="hover:text-white transition-colors"
            >
              Create
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/profile" className="hover:text-white transition-colors">
              Profile
            </Link>
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
          </div>
        </div>
        <div className="mt-12 border-t border-white/5 pt-8 text-center text-[10px] font-bold uppercase tracking-widest text-gray-600">
          &copy; {new Date().getFullYear()} POSTFEED CORP. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
