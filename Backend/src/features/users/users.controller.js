const usersModel = require("./users.model");
const postsModel = require("../posts/posts.model");
const musicModel = require("../music/music.model");
const storageService = require("../../services/storage.service");
const { serializeUser } = require("../../utils/userSerializer");

// ─── Get Own Profile ──────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await usersModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found." });
    return res.status(200).json({ success: true, user: serializeUser(user) });
  } catch (err) {
    console.error("Get Profile Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to load profile." });
  }
};

// ─── Get User by ID (public) ──────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await usersModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found." });
    return res.status(200).json({ success: true, user: serializeUser(user) });
  } catch (err) {
    console.error("Get User Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to load user." });
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;

    if (!username && bio === undefined && !req.file) {
      return res.status(400).json({ success: false, error: "No fields to update provided." });
    }

    const updateData = {};

    if (username?.trim()) {
      const existing = await usersModel.findOne({ username: username.trim(), _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(409).json({ success: false, error: "Username is already taken." });
      }
      updateData.username = username.trim();
    }

    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      const result = await storageService.uploadFromBuffer(req.file.buffer, req.file.originalname, "postfeed/avatars");
      updateData.profilePic = result.url;
    }

    const updated = await usersModel.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, error: "User not found." });

    return res.status(200).json({ success: true, message: "Profile updated successfully.", user: serializeUser(updated) });
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    if (err.code === 11000) return res.status(409).json({ success: false, error: "Username already taken." });
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, error: Object.values(err.errors).map((e) => e.message).join(". ") });
    }
    if (err.message?.includes("upload") || err.message?.includes("ImageKit")) {
      return res.status(500).json({ success: false, error: "Profile picture upload failed. Use an image under 5MB." });
    }
    return res.status(500).json({ success: false, error: "Failed to update profile." });
  }
};

// ─── Delete Account ───────────────────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    // Fetch all user content to collect storage file IDs
    const [posts, tracks, userRecord] = await Promise.all([
      postsModel.find({ user: req.user.id }).select("imageFileId"),
      musicModel.find({ artist: req.user.id }).select("audioFileId thumbnailFileId"),
      usersModel.findById(req.user.id).select("profilePicFileId"),
    ]);

    // Delete all storage files concurrently (best-effort — don't fail if missing)
    const fileIds = [
      ...posts.map((p) => p.imageFileId).filter(Boolean),
      ...tracks.flatMap((t) => [t.audioFileId, t.thumbnailFileId]).filter(Boolean),
      userRecord?.profilePicFileId,
    ].filter(Boolean);

    await Promise.allSettled(fileIds.map((id) => storageService.deleteFile(id)));

    // Clean up all DB records concurrently
    await Promise.all([
      postsModel.deleteMany({ user: req.user.id }),
      musicModel.deleteMany({ artist: req.user.id }),
    ]);

    const deleted = await usersModel.findByIdAndDelete(req.user.id);
    if (!deleted) return res.status(404).json({ success: false, error: "User not found." });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete Account Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to delete account." });
  }
};

module.exports = { getProfile, getUserById, updateProfile, deleteAccount };
