const musicModel = require("../models/music.model");
const storageService = require("../services/storage.service");

// Return ImageKit auth params for client-side upload
const getImageKitAuth = async (req, res) => {
  try {
    const authParams = storageService.getAuthParams();
    return res.status(200).json({
      success: true,
      ...authParams,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("ImageKit Auth Error:", error);
    return res.status(500).json({
      success: false,
      error:
        "Could not initialize file upload service. Please try again later.",
    });
  }
};

const createMusic = async (req, res) => {
  try {
    const { title, audioUrl, audioFileId, thumbnailUrl, thumbnailFileId } =
      req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    if (!audioUrl || !audioFileId) {
      return res
        .status(400)
        .json({ success: false, error: "Audio file is required" });
    }

    const music = await musicModel.create({
      audioUrl: audioUrl,
      title: title.trim(),
      thumbnailUrl: thumbnailUrl || null,
      audioFileId,
      thumbnailFileId: thumbnailFileId || null,
      artist: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Music uploaded successfully",
      music: {
        id: music._id,
        audioUrl: music.audioUrl,
        title: music.title,
        thumbnailUrl: music.thumbnailUrl,
        artist: music.artist,
      },
    });
  } catch (error) {
    console.error("Create Music Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, error: messages.join(". ") });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to save music. Please try again.",
    });
  }
};

const getAllMusics = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const musics = await musicModel
      .find()
      .populate("artist", "username profilePic")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ success: true, musics });
  } catch (error) {
    console.error("Get Musics Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load music tracks. Please refresh the page.",
    });
  }
};

const deleteMusic = async (req, res) => {
  try {
    const music = await musicModel.findById(req.params.musicId);

    if (!music) {
      return res.status(404).json({ success: false, error: "Music not found" });
    }

    if (music.artist.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this track",
      });
    }

    // Delete files from ImageKit
    if (music.audioFileId) {
      await storageService.deleteFile(music.audioFileId);
    }
    if (music.thumbnailFileId) {
      await storageService.deleteFile(music.thumbnailFileId);
    }

    await musicModel.findByIdAndDelete(req.params.musicId);

    return res
      .status(200)
      .json({ success: true, message: "Music deleted successfully" });
  } catch (error) {
    console.error("Delete Music Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete track. Please try again.",
    });
  }
};

module.exports = { getImageKitAuth, createMusic, getAllMusics, deleteMusic };
