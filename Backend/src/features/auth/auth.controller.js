const userModel = require("../user/user.model");
const jwt = require("jsonwebtoken");
const { serializeUser } = require("../../utils/userSerializer");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: COOKIE_MAX_AGE,
});

const signToken = (user) =>
  jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const handleDbError = (err, res) => {
  const mongoErrors = ["MongoNetworkError", "MongoAuthenticationError", "MongoTimeoutError"];
  if (mongoErrors.includes(err.name)) {
    return res.status(503).json({ success: false, error: "Database unavailable. Please try again later." });
  }
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(", ") });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ success: false, error: `An account with this ${field} already exists.` });
  }
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
    }

    const existing = await userModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? "email" : "username";
      return res.status(409).json({ success: false, error: `An account with this ${field} already exists.` });
    }

    const user = await userModel.create({ username, email: email.toLowerCase(), password });
    const token = signToken(user);
    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: serializeUser(user),
      token,
    });
  } catch (err) {
    console.error("Register Error:", err.message);
    return handleDbError(err, res);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ success: false, error: "Email/username and password are required." });
    }

    const query = [
      email ? { email: email.toLowerCase() } : null,
      username ? { username } : null,
    ].filter(Boolean);

    const user = await userModel.findOne({ $or: query }).select("+password");

    // Use a single vague message to prevent user enumeration
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    const token = signToken(user);
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: serializeUser(user),
      token,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    return handleDbError(err, res);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully." });
};

module.exports = { register, login, logout };
