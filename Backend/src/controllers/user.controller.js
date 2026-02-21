const userModel = require("../models/user.model");
const postModel = require("../models/post.model");
const storageService = require("../services/storage.service");

const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;

    if (!username && bio === undefined && !req.file) {
      return res.status(400).json({
        success: false,
        error: "No fields to update provided",
      });
    }

    const updateData = {};

    if (username && username.trim() !== "") {
      // Check if username is already taken by another user
      const existingUser = await userModel.findOne({
        username: username.trim(),
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Username is already taken",
        });
      }
      updateData.username = username.trim();
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    // Upload new profile picture if provided
    if (req.file) {
      const uploadResult = await storageService.uploadFromBuffer(
        req.file.buffer,
      );
      updateData.profilePic = uploadResult.url;
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(req.user.id, updateData, { new: true })
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    // Delete all posts by this user first
    await postModel.deleteMany({ user: req.user.id });

    const deletedUser = await userModel.findByIdAndDelete(req.user.id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Clear auth cookie
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 0,
    });

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports = {
  getProfile,
  getUserById,
  updateProfile,
  deleteAccount,
};
