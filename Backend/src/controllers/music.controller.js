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
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
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
      uri: audioUrl,
      title: title.trim(),
      thumbnail: thumbnailUrl || null,
      audioFileId,
      thumbnailFileId: thumbnailFileId || null,
      artist: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Music uploaded successfully",
      music: {
        id: music._id,
        uri: music.uri,
        title: music.title,
        thumbnail: music.thumbnail,
        artist: music.artist,
      },
    });
  } catch (error) {
    console.error("Create Music Error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

const getAllMusics = async (req, res) => {
  try {
    const musics = await musicModel
      .find()
      .populate("artist", "username profilePic")
      .sort({ _id: -1 });

    return res.status(200).json({ success: true, musics });
  } catch (error) {
    console.error("Get Musics Error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
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
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

module.exports = { getImageKitAuth, createMusic, getAllMusics, deleteMusic };
