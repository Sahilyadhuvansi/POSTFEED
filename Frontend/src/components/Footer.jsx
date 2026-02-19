import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="main-footer glass">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="logo-section-small">
            <span className="logo-icon">🤫</span>
            <span className="logo-text">
              Whisper<span className="accent">Secrets</span>
            </span>
          </Link>
          <p className="footer-tagline">
            Share your thoughts, anonymously or protected.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Explore</h4>
            <Link to="/">Feed</Link>
            <Link to="/create-post">Share Secret</Link>
          </div>
          <div className="footer-column">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/profile">Profile</Link>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} WhisperSecrets. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
