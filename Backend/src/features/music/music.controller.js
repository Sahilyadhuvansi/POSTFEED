// ─── Commit: Music Controller - Audio Library Logic ───
// What this does: Manages music uploads, retrieval, and deletion within the platform.
// Why it exists: To provide a structured way for artists to share their tracks with the community.
// How it works: Integrates with the Music Model and external storage via 'storageService' (ImageKit).
// Beginner note: The Music Controller handles the "Vibe" of the app, making sure songs are saved and played correctly.

"use strict";

const musicModel = require("./music.model");
const storageService = require("../../services/storage.service");
const ErrorResponse = require("../../utils/ErrorResponse");

/**
 * MUSIC CONTROLLER - Post Music AI (Production Refactor)
 * Senior Feature: Silent Error Handling & Scalable File Cleanup
 */

// ─── Commit: Client-Side Upload Authorization ───
// What this does: Provides the frontend with secure, short-lived tokens for direct file uploads.
// Why it exists: For security and efficiency. Direct uploads reduce server CPU and bandwidth.
// How it works: Generates a signature and timestamp that the storage provider (ImageKit) validates.
// Interview insight: "Direct-to-S3-style" uploads are a best practice for handling large media files.

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

// ─── Commit: Create Music Entry ───
// What this does: Saves the metadata of an uploaded track into the database.
// why it exists: To index the song (title, artist, URLs) so it can be searched and played.
// How it works: Takes URLs and File IDs from the frontend after a successful direct upload.

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

// ─── Commit: paginated Music Discovery ───
// What this does: Lists all music tracks with pagination and artist population.
// Why it exists: To build the explore feed where users find new music.

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

// ─── Commit: Atomic track Deletion ───
// What this does: Removes a song from the DB and triggers cleanup of the binary files.
// How it works: Uses 'Promise.allSettled' to attempt file deletion without blocking the DB update.
// Interview insight: Atomic deletes are ideal, but if storage cleanup fails, it shouldn't stop the user from deleting the DB record.

const deleteMusic = async (req, res, next) => {
  try {
    const music = await musicModel.findById(req.params.musicId);

    if (!music) {
      return next(new ErrorResponse("Track not found", 404, "NOT_FOUND"));
    }
    
    if (music.artist.toString() !== req.user.id) {
      return next(new ErrorResponse("Forbidden", 403, "NOT_AUTHORIZED"));
    }

    // Direct deletion with non-blocking file purging
    Promise.allSettled([
      music.audioFileId ? storageService.deleteFile(music.audioFileId) : Promise.resolve(),
      music.thumbnailFileId ? storageService.deleteFile(music.thumbnailFileId) : Promise.resolve(),
    ]).catch(() => {}); 

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

