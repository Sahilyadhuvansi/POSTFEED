import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="auth-card relative">
        {/* Header */}
        <div className="auth-header">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-pink-500 rounded-lg blur opacity-75"></div>
              <div className="relative px-4 py-2 bg-black rounded-lg">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-pink-500 bg-clip-text text-transparent">
                  POSTFEED
                </span>
              </div>
            </div>
          </div>
          <h2 className="auth-title text-2xl">Welcome Back</h2>
          <p className="auth-subtitle">
            Sign in to share your story and discover new whispers
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative group">
              <input
                type="email"
                required
                className="input-field peer"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 to-pink-500/0 opacity-0 group-focus-within:opacity-10 transition duration-300 pointer-events-none"></div>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input-field peer pr-12"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-300 transition"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    ></path>
                    <path d="M15.171 13.576l1.414 1.414a1 1 0 01-1.414 1.414l-1.415-1.414M8 10l.707.707a1 1 0 01-1.414 1.415L6.586 11.415M8.828 4.172a1 1 0 010 1.415L8 4.879l1.414 1.414M18 18a1 1 0 11-1.414-1.414l1.414 1.414z"></path>
                  </svg>
                )}
              </button>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 to-pink-500/0 opacity-0 group-focus-within:opacity-10 transition duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="btn-submit mt-8">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 before:absolute before:inset-0 before:border-t before:border-white/10">
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-950 px-3 text-gray-500">
              New to POSTFEED?
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="form-link">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-indigo-400 hover:text-pink-400 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
