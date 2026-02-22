const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { serializeUser } = require("../utils/userSerializer");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters long",
    });
  }

  try {
    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET not set in environment variables");
      return res.status(500).json({
        success: false,
        error: "Server configuration error: JWT_SECRET not set",
      });
    }

    const isUserExist = await userModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (isUserExist) {
      return res.status(409).json({
        success: false,
        error: "User with this email or username already exists",
      });
    }

    const user = await userModel.create({
      username,
      email: email.toLowerCase(),
      password,
    });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: serializeUser(user),
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);

    // Duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `An account with this ${field} already exists.`,
      });
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(". "),
      });
    }

    // Database connection error
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoAuthenticationError"
    ) {
      console.error("Database connection error:", err.message);
      return res.status(503).json({
        success: false,
        error: "Database unavailable. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
};

exports.login = async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    return res.status(400).json({
      success: false,
      error: "Email/Username and password are required",
    });
  }

  try {
    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET not set in environment variables");
      return res.status(500).json({
        success: false,
        error: "Server configuration error: JWT_SECRET not set",
      });
    }

    const user = await userModel
      .findOne({
        $or: [
          email ? { email: email.toLowerCase() } : null,
          username ? { username } : null,
        ].filter(Boolean),
      })
      .select("+password");

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: serializeUser(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);

    // Database connection error
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoAuthenticationError"
    ) {
      console.error("Database connection error:", err.message);
      return res.status(503).json({
        success: false,
        error: "Database unavailable. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
};

exports.logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 0,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
