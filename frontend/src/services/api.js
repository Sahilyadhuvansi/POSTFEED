"use strict";

import axios from "axios";
import { API_URL } from "../config";

/**
 * Centralized API Layer
 * Configured with baseURL, withCredentials, and global interceptors
 */

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: false,  // ← Change: JWT is in header, not cookie. Cross-origin cookies were causing CORS preflight failures
  timeout: 60000,          // ← Change: was 15000. Render free tier cold-start takes 50s+
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Global Errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      // Prevent infinite redirect loops
      if (path !== "/login" && path !== "/register") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
