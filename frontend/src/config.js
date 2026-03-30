// --- API CONFIGURATION ---
// Priorities:
// 1) VITE_API_URL from environment (recommended)
// 2) Local development fallback
// 3) Production domain fallback map

const FRONTEND_HOST = window.location.hostname;
const ENV_API_URL = (import.meta.env.VITE_API_URL || "").trim();

const PRODUCTION_API_FALLBACKS = {
  // Primary production frontend domain
  "postfeeds-xi.vercel.app": "https://post-music.onrender.com",
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const FALLBACK_API_URL = LOCAL_HOSTS.has(FRONTEND_HOST)
  ? "http://localhost:3001"
  : PRODUCTION_API_FALLBACKS[FRONTEND_HOST] || "";

export const API_URL = (ENV_API_URL || FALLBACK_API_URL).replace(/\/+$/, "");

if (!API_URL) {
  console.warn(
    "[config] API URL is not configured. Set VITE_API_URL in your frontend environment (Vercel Project Settings → Environment Variables).",
  );
}

export const DEFAULT_AVATAR =
  import.meta.env.VITE_DEFAULT_AVATAR ||
  "https://www.gravatar.com/avatar/?d=mp&f=y&s=200";

export const IMAGEKIT_UPLOAD_URL =
  import.meta.env.VITE_IMAGEKIT_UPLOAD_URL ||
  "https://upload.imagekit.io/api/v1/files/upload";
