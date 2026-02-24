const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { serializeUser } = require("../utils/userSerializer");

const register = async (req, res) => {
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
    console.error("❌ Register Error:", err.message);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        error: `An account with this ${field} already exists.`,
      });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoAuthenticationError" ||
      err.name === "MongoTimeoutError"
    ) {
      return res.status(503).json({
        success: false,
        error: "Database connection error. Please try again later.",
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

const login = async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    return res.status(400).json({
      success: false,
      error: "Email/Username and password are required",
    });
  }

  try {
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
    console.error("❌ Login Error:", err.message);

    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoAuthenticationError" ||
      err.name === "MongoTimeoutError"
    ) {
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

const logout = (req, res) => {
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

module.exports = {
  register,
  login,
  logout,
};
