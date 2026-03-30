// --- API CONFIGURATION ---
// Priorities: 
// 1. VITE_API_URL from environment (best for production)
// 2. Automated detection based on environment
export const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? "http://localhost:3001" : "");
// ^ Note: If API_URL is empty, Axios will use the current host. 
// If you are on Render, ensure you set VITE_API_URL to your Render backend URL.


export const DEFAULT_AVATAR =
  import.meta.env.VITE_DEFAULT_AVATAR ||
  "https://www.gravatar.com/avatar/?d=mp&f=y&s=200";

export const IMAGEKIT_UPLOAD_URL =
  import.meta.env.VITE_IMAGEKIT_UPLOAD_URL ||
  "https://upload.imagekit.io/api/v1/files/upload";

