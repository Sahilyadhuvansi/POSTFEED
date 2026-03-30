// ─── Commit: Authentication Controller - Core Logic ───
// What this does: Manages user registration, login, logout, and profile fetching.
// Why it exists: To authorize and identify users within the application.
// How it works: Interacts with the User Model and uses JWT (JSON Web Tokens) for session management.
// Beginner note: The Auth Controller is like a bouncer at a club—it checks IDs and gives out wristbands (tokens).

"use strict";

const usersModel = require("../users/users.model");
const jwt = require("jsonwebtoken");
const { serializeUser } = require("../../utils/userSerializer");
const ErrorResponse = require("../../utils/ErrorResponse");

// ─── Commit: Security Helpers and Token Signing ───
// What this does: Defines cookie options and JWT generation logic.
// Why it exists: Secure cookies (httpOnly) prevent Cross-Site Scripting (XSS) from stealing tokens.
// How it works: signToken() encodes user data into a cryptographically signed string.
// Interview insight: Always use 'httpOnly' and 'secure' flags for session cookies in production.

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

// ─── Commit: User Registration Logic ───
// What this does: Handles new account creation, including validation and duplicate checks.
// How it works: Hashes passwords (via model hooks) and returns a session cookie/token on success.

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return next(new ErrorResponse("All fields are required", 400));
    }
    if (password.length < 6) {
      return next(new ErrorResponse("Password must be at least 6 characters", 400));
    }

    const existing = await usersModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? "email" : "username";
      return next(new ErrorResponse(`An account with this ${field} already exists`, 409, "DUPLICATE_ENTRY"));
    }

    const user = await usersModel.create({ 
      username, 
      email: email.toLowerCase(), 
      password 
    });
    const token = signToken(user);
    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: serializeUser(user),
      token,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
};

// ─── Commit: Secure Login Strategy ───
// What this does: Authenticates existing users and returns a session.
// Why it exists: To permit users to access protected routes after identity verification.
// How it works: Usesbcrypt comparison to verify passwords without storing them in plain text.
// Interview insight: Use vague error messages (e.g., "Invalid credentials") to prevent account enumeration.

const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return next(new ErrorResponse("Email/username and password are required", 400));
    }

    const query = [
      email ? { email: email.toLowerCase() } : null,
      username ? { username } : null,
    ].filter(Boolean);

    const user = await usersModel.findOne({ $or: query }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return next(new ErrorResponse("Invalid credentials", 401, "AUTH_FAILED"));
    }

    const token = signToken(user);
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: serializeUser(user),
      token,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
};

// ─── Commit: Session Termination (Logout) ───
// What this does: Clears the authentication cookies from the client browser.

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.status(200).json({ 
    success: true, 
    message: "Logged out successfully",
    requestId: req.id 
  });
};

// ─── Commit: Profile Data Fetching (Get Me) ───
// What this does: Retrieves the data for the currently authenticated user.

const getMe = async (req, res, next) => {
  try {
    const user = await usersModel.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404, "USER_NOT_FOUND"));
    }
    return res.status(200).json({ 
      success: true, 
      user: serializeUser(user),
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe };

