import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (profilePic) formData.append("profilePic", profilePic);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      await axios.post(`${apiUrl}/api/auth/register`, formData);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
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

      <div className="auth-card relative max-w-lg">
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
          <h2 className="auth-title text-2xl">Create Your Account</h2>
          <p className="auth-subtitle">
            Join thousands sharing their world and secrets
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username Input */}
            <div className="relative group">
              <input
                type="text"
                required
                className="input-field"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 to-pink-500/0 opacity-0 group-focus-within:opacity-10 transition duration-300 pointer-events-none"></div>
            </div>

            {/* Email Input */}
            <div className="relative group">
              <input
                type="email"
                required
                className="input-field"
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
                  </svg>
                )}
              </button>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 to-pink-500/0 opacity-0 group-focus-within:opacity-10 transition duration-300 pointer-events-none"></div>
            </div>

            {/* Confirm Password Input */}
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input-field"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 to-pink-500/0 opacity-0 group-focus-within:opacity-10 transition duration-300 pointer-events-none"></div>
            </div>

            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 block">
                Profile Picture (Optional)
              </label>
              <div className="relative">
                {profilePicPreview ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/15 bg-black/40">
                    <img
                      src={profilePicPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePic(null);
                        setProfilePicPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-white hover:text-black transition text-white"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-indigo-500/50 bg-black/40 hover:bg-indigo-500/5 cursor-pointer transition">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg
                        className="w-6 h-6 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"></path>
                      </svg>
                      <span className="text-xs font-semibold text-gray-500">
                        Upload photo
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/10">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-black/40 text-indigo-600 cursor-pointer mt-1"
            />
            <label
              htmlFor="terms"
              className="text-xs text-gray-400 cursor-pointer"
            >
              I agree to POSTFEED's{" "}
              <Link to="#" className="text-indigo-400 hover:text-pink-400">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="#" className="text-indigo-400 hover:text-pink-400">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !agreeTerms}
            className="btn-submit mt-6"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Creating account...</span>
              </div>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 before:absolute before:inset-0 before:border-t before:border-white/10">
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-950 px-3 text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Login Link */}
        <div className="form-link">
          <p className="text-sm text-gray-400">
            Already a member?{" "}
            <Link
              to="/login"
              className="font-bold text-indigo-400 hover:text-pink-400 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
