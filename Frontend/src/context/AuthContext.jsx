import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Login failed",
      };
    }
  };

  const register = async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, formData);
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
    } catch (error) {
      console.error("Logout API failed", error);
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
