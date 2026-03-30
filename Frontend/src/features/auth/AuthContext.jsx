// ─── Commit: Authentication context - Global user State ───
// What this does: Manages the logged-in user's state and persists it in LocalStorage.
// Why it exists: To keep the user "logged in" across page refreshes and different components.
// How it works: Uses React Context API to provide 'user', 'login', and 'logout' functions to the whole app.
// Beginner note: Context is like a global megaphone—any component can listen for the user's data.

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_URL as BASE_URL } from "../../config";

const AuthContext = createContext(null);

// ─── Commit: Specialized Auth API Instance ───
// Why it exists: To isolate authentication requests and handle tokens automatically.

const API = axios.create({
  baseURL: `${BASE_URL}/api/auth`,
  withCredentials: true,
  timeout: 15000,
});

// ─── Commit: JWT Interceptor Strategy ───
// What this does: Automatically adds the "Bearer token" to every outgoing request.
// Interview insight: Using interceptors centralizes token management, preventing code duplication in every component.

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const parseStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const persistUser = (userData, token) => {
  localStorage.setItem("user", JSON.stringify(userData));
  if (token) localStorage.setItem("token", token);
};

const clearStorage = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(parseStoredUser);
  const [loading, setLoading] = useState(true);

  // ─── Commit: Session Rehydration (The "Stay Logged In" Logic) ───
  // What this does: Checks with the backend on app start if the stored token is still valid.
  // How it works: Calls the /me endpoint. If it fails, the user is logged out immediately.

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    API.get("/me")
      .then((res) => {
        const userData = res.data.user;
        setUser(userData);
        persistUser(userData, token);
      })
      .catch(() => {
        setUser(null);
        clearStorage();
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Commit: Authenticated Action Handlers (Login/Reg/Logout) ───

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const res = await API.post("/login", credentials);
      const userData = res.data.user;
      setUser(userData);
      persistUser(userData, res.data.token);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err, "Login failed. Please try again.") };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    try {
      const res = await API.post("/register", formData);
      const userData = res.data.user;
      setUser(userData);
      persistUser(userData, res.data.token);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err, "Registration failed. Please try again.") };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.post("/logout");
    } catch (err) {
      console.error("Logout error:", err.message);
    } finally {
      setUser(null);
      clearStorage();
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    persistUser(userData, localStorage.getItem("token"));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Commit: Custom Hook Accessory ───
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// ─── Commit: Utility - Robust Error Handling ───
function extractErrorMessage(err, fallback) {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message?.includes("Network Error")) return "Cannot reach server. Check your internet connection.";
  if (err.code === "ECONNABORTED") return "Request timed out. Please try again.";
  return fallback;
}

