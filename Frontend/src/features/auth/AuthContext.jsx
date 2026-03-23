import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { API_URL as BASE_URL } from "../../config";

const AuthContext = createContext(null);

const API = axios.create({
  baseURL: `${BASE_URL}/api/auth`,
  withCredentials: true,
  timeout: 15000,
});

// Attach stored token to every request
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
  const [loading, setLoading] = useState(false);

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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// ─── Error Message Extractor ──────────────────────────────────────────────────
function extractErrorMessage(err, fallback) {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message?.includes("Network Error")) return "Cannot reach server. Check your internet connection.";
  if (err.code === "ECONNABORTED") return "Request timed out. Please try again.";
  return fallback;
}
