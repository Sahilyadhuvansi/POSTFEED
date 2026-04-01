"use strict";

const musicModel = require("./music.model");
const storageService = require("../../services/storage.service");
const ErrorResponse = require("../../utils/ErrorResponse");

/**
 * MUSIC CONTROLLER - Post Music AI (Production Refactor)
 * Senior Feature: Silent Error Handling & Scalable File Cleanup
 */

// ─── Create Music (YouTube Focus) ─────────────────────────────────────────────
const createMusic = async (req, res, next) => {
  try {
    const { title, youtubeUrl, thumbnailUrl } = req.body;

    if (!title?.trim()) {
      return next(new ErrorResponse("Title is required", 400));
    }
    if (!youtubeUrl) {
      return next(new ErrorResponse("YouTube URL is required", 400));
    }

    const music = await musicModel.create({
      youtubeUrl,
      title: title.trim(),
      thumbnailUrl: thumbnailUrl || null,
      artist: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Track saved to your universe",
      music: {
        id: music._id,
        youtubeUrl: music.youtubeUrl,
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
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [musics, total] = await Promise.all([
      musicModel
        .find()
        .select("youtubeUrl title thumbnailUrl artist createdAt")
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

    await musicModel.findByIdAndDelete(req.params.musicId);

    return res.status(200).json({ 
      success: true, 
      message: "Track removed from your universe",
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createMusic, getAllMusics, deleteMusic };

