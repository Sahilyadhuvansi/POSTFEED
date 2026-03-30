const PROD_BACKEND = "https://postfeed-backend.vercel.app";
export const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('vercel.app') ? PROD_BACKEND : "http://localhost:3001");

export const DEFAULT_AVATAR =
  import.meta.env.VITE_DEFAULT_AVATAR ||
  "https://www.gravatar.com/avatar/?d=mp&f=y&s=200";

export const IMAGEKIT_UPLOAD_URL =
  import.meta.env.VITE_IMAGEKIT_UPLOAD_URL ||
  "https://upload.imagekit.io/api/v1/files/upload";

