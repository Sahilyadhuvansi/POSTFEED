const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const storageService = require("../services/storage.service");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const isUserExist = await userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (isUserExist) {
      return res.status(409).json({ message: "User already exists" });
    }

    let profilePicUrl;
    if (req.file) {
      const uploadResult = await storageService.uploadFromBuffer(
        req.file.buffer,
      );
      profilePicUrl = uploadResult.url;
    }

    const user = await userModel.create({
      username,
      email,
      password,
      profilePic: profilePicUrl, // If undefined, model default kicks in
    });
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await userModel.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};
