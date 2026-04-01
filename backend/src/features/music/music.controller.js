"use strict";

const musicModel = require("./music.model");
const storageService = require("../../services/storage.service");
const ErrorResponse = require("../../utils/ErrorResponse");

/**
 * MUSIC CONTROLLER - Post Music AI (Production Refactor)
 * Senior Feature: Silent Error Handling & Scalable File Cleanup
 */

// ─── ImageKit Auth ────────────────────────────────────────────────────────────
const getImageKitAuth = (req, res, next) => {
  try {
    const authParams = storageService.getAuthParams();
    return res.status(200).json({
      success: true,
      ...authParams,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
};

// ─── Create Music ─────────────────────────────────────────────────────────────
const createMusic = async (req, res, next) => {
  try {
    const { title, audioUrl, audioFileId, thumbnailUrl, thumbnailFileId } = req.body;

    if (!title?.trim()) {
      return next(new ErrorResponse("Title is required", 400));
    }
    if (!audioUrl || !audioFileId) {
      return next(new ErrorResponse("Audio file is required", 400));
    }

    const music = await musicModel.create({
      audioUrl,
      title: title.trim(),
      thumbnailUrl: thumbnailUrl || null,
      audioFileId,
      thumbnailFileId: thumbnailFileId || null,
      artist: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Track uploaded successfully",
      music: {
        id: music._id,
        audioUrl: music.audioUrl,
        title: music.title,
        thumbnailUrl: music.thumbnailUrl,
        artist: music.artist,
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Music ────────────────────────────────────────────────────────────
const getAllMusics = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 15, 50);
    const skip = (page - 1) * limit;

    const [musics, total] = await Promise.all([
      musicModel
        .find()
        .select("audioUrl title thumbnailUrl artist createdAt")
        .populate("artist", "username profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      musicModel.countDocuments(),
    ]);

    return res.status(200).json({ 
      success: true, 
      musics, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit),
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Music ─────────────────────────────────────────────────────────────
const deleteMusic = async (req, res, next) => {
  try {
    const music = await musicModel.findById(req.params.musicId);

    if (!music) {
      return next(new ErrorResponse("Track not found", 404, "NOT_FOUND"));
    }
    
    if (music.artist.toString() !== req.user.id) {
      return next(new ErrorResponse("Forbidden", 403, "NOT_AUTHORIZED"));
    }

    // Delete storage files concurrently (best-effort — non-blocking for DB delete)
    Promise.allSettled([
      music.audioFileId ? storageService.deleteFile(music.audioFileId) : Promise.resolve(),
      music.thumbnailFileId ? storageService.deleteFile(music.thumbnailFileId) : Promise.resolve(),
    ]).catch(() => {}); // Silent catch for post-DB-delete cleanup

    await musicModel.findByIdAndDelete(req.params.musicId);

    return res.status(200).json({ 
      success: true, 
      message: "Track deleted successfully",
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getImageKitAuth, createMusic, getAllMusics, deleteMusic };
