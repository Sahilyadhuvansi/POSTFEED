import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_URL as BASE_URL } from "../config";

const AuthContext = createContext();

const API_URL = `${BASE_URL}/api/auth`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      let message = "Login failed. Please try again.";

      if (error.response?.status === 401) {
        message = error.response.data?.error || "Invalid email or password.";
      } else if (error.response?.status === 400) {
        message = error.response.data?.error || "Please fill in all fields.";
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message?.includes("Network Error")) {
        message =
          "Cannot reach the server. Please check your internet connection.";
      }

      return { success: false, message };
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
      let message = "Registration failed. Please try again.";

      if (error.response?.status === 409) {
        message =
          error.response.data?.error ||
          "An account with this email or username already exists.";
      } else if (error.response?.status === 400) {
        message =
          error.response.data?.error ||
          "Please check your input and try again.";
      } else if (error.response?.status === 413) {
        message =
          "Profile picture is too large. Please use an image under 4.5MB.";
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message?.includes("Network Error")) {
        message =
          "Cannot reach the server. Please check your internet connection.";
      }

      return { success: false, message };
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
