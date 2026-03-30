"use strict";

const usersModel = require("./users.model");
const postsModel = require("../posts/posts.model");
const musicModel = require("../music/music.model");
const storageService = require("../../services/storage.service");
const { serializeUser } = require("../../utils/userSerializer");
const ErrorResponse = require("../../utils/ErrorResponse");

/**
 * USERS CONTROLLER - Post Music AI (Production Refactor)
 * Senior Feature: Consistent Error Delegation & High-Reliability Cleanups
 */

// ─── Get Own Profile ──────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
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

// ─── Get User by ID (public) ──────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await usersModel.findById(req.params.id);
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

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body;

    if (!username && bio === undefined && !req.file) {
      return next(new ErrorResponse("No fields provided for update", 400));
    }

    const updateData = {};
    if (username?.trim()) {
      const existing = await usersModel.findOne({ username: username.trim(), _id: { $ne: req.user.id } });
      if (existing) {
        return next(new ErrorResponse("Username is already taken", 409, "DUPLICATE_ENTRY"));
      }
      updateData.username = username.trim();
    }

    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      const result = await storageService.uploadFromBuffer(req.file.buffer, req.file.originalname, "postfeed/avatars");
      updateData.profilePic = result.url;
    }

    const updated = await usersModel.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true });
    if (!updated) {
      return next(new ErrorResponse("User not found", 404, "USER_NOT_FOUND"));
    }

    return res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully", 
      user: serializeUser(updated),
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Account ───────────────────────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const [posts, tracks, userRecord] = await Promise.all([
      postsModel.find({ user: req.user.id }).select("imageFileId"),
      musicModel.find({ artist: req.user.id }).select("audioFileId thumbnailFileId"),
      usersModel.findById(req.user.id).select("profilePicFileId"),
    ]);

    // Gather file IDs for asynchronous cleanup
    const fileIds = [
      ...posts.map((p) => p.imageFileId).filter(Boolean),
      ...tracks.flatMap((t) => [t.audioFileId, t.thumbnailFileId]).filter(Boolean),
      userRecord?.profilePicFileId,
    ].filter(Boolean);

    // Initial silent cleanup trigger
    Promise.allSettled(fileIds.map((id) => storageService.deleteFile(id))).catch(() => {});

    await Promise.all([
      postsModel.deleteMany({ user: req.user.id }),
      musicModel.deleteMany({ artist: req.user.id }),
      usersModel.findByIdAndDelete(req.user.id)
    ]);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({ 
      success: true, 
      message: "Account deleted successfully",
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getUserById, updateProfile, deleteAccount };
