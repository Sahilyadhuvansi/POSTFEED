const userModel = require("../models/user.model");
const storageService = require("../services/storage.service");

exports.getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

exports.updateProfile = async (req, res) => {
  const { username, bio } = req.body;
  try {
    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      const uploadResult = await storageService.uploadFromBuffer(
        req.file.buffer,
      );
      updateData.profilePic = uploadResult.url;
    }

    const user = await userModel.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};
