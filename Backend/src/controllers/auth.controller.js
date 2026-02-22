const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        createdAt: user.createdAt,
      },
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
    // Detects validation errors → extracts all field messages → combines them → returns a clean 400 response to the client.
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(". "),
      });
    }

    // Fallback
    return res.status(500).json({
      success: false,
      error: "Internal server error",
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
    const user = await userModel
      .findOne({
        $or: [
          email ? { email: email.toLowerCase() } : null,
          username ? { username } : null,
        ].filter(Boolean), // Removes all falsy values (like null) from [ { email: "test@mail.com" }, null ], resulting in [ { email: "test@mail.com" } ].
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

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
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
