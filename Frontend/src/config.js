// ─── Commit: Global Frontend Configuration and API Setup ───
// What this does: Defines environment-specific URLs and initializes the API client (Axios).
// Why it exists: To ensure the frontend knows where to send requests and how to handle them.
// How it works: Uses import.meta.env for Vite environment variables and axios.create() for the base client.
// Beginner note: Config is like the "Settings" page of your app, where you define the global rules.

const PROD_BACKEND = "https://postfeed-backend.vercel.app";
export const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('vercel.app') ? PROD_BACKEND : "http://localhost:3001");

export const DEFAULT_AVATAR =
  import.meta.env.VITE_DEFAULT_AVATAR ||
  "https://www.gravatar.com/avatar/?d=mp&f=y&s=200";

export const IMAGEKIT_UPLOAD_URL =
  import.meta.env.VITE_IMAGEKIT_UPLOAD_URL ||
  "https://upload.imagekit.io/api/v1/files/upload";

// ─── Commit: Centralized API Client ───
// What this does: Creates a pre-configured instance of Axios for all network requests.
// Why it exists: Reduces code duplication and ensures every request has the correct baseURL and credentials.
// How it works: axios.create() sets defaults like withCredentials (for cookies) and timeout.
// Interview insight: An 'API Instance' pattern is standard in professional SPAs for maintainability.

import axios from "axios";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  timeout: 15000,
});

// ─── Commit: Authorization Interceptors ───
// What this does: Automatically adds the JWT token to every outgoing request.
// Why it exists: To prove the user is logged in to the backend for protected actions.
// How it works: The request interceptor runs before the request leaves the browser.
// Beginner note: It's like having a system that automatically stamps your passport before every trip.

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Commit: Response Handling (Auth Redirect) ───
// What this does: Handles 401 Unauthorized errors by logging out and redirecting the user.
// Why it exists: To ensure security. If a token is expired or invalid, the user should be forced to re-login.
// How it works: The response interceptor checks the status code of every response from the server.
// Interview insight: Session management in the browser requires clear "eviction" logic when tokens fail.

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

