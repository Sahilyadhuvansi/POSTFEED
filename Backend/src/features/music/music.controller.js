const musicModel = require("./music.model");
const storageService = require("../../services/storage.service");

// ─── ImageKit Auth ────────────────────────────────────────────────────────────
const getImageKitAuth = (_req, res) => {
  try {
    const authParams = storageService.getAuthParams();
    return res.status(200).json({
      success: true,
      ...authParams,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });
  } catch (err) {
    console.error("ImageKit Auth Error:", err.message);
    return res.status(500).json({ success: false, error: "Could not initialize upload service." });
  }
};

// ─── Create Music ─────────────────────────────────────────────────────────────
const createMusic = async (req, res) => {
  try {
    const { title, audioUrl, audioFileId, thumbnailUrl, thumbnailFileId } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: "Title is required." });
    }
    if (!audioUrl || !audioFileId) {
      return res.status(400).json({ success: false, error: "Audio file is required." });
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
      message: "Track uploaded successfully.",
      music: {
        id: music._id,
        audioUrl: music.audioUrl,
        title: music.title,
        thumbnailUrl: music.thumbnailUrl,
        artist: music.artist,
      },
    });
  } catch (err) {
    console.error("Create Music Error:", err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, error: Object.values(err.errors).map((e) => e.message).join(". ") });
    }
    return res.status(500).json({ success: false, error: "Failed to save track. Please try again." });
  }
};

// ─── Get All Music ────────────────────────────────────────────────────────────
const getAllMusics = async (req, res) => {
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

    return res.status(200).json({ success: true, musics, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Get Musics Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to load music. Please refresh." });
  }
};

// ─── Delete Music ─────────────────────────────────────────────────────────────
const deleteMusic = async (req, res) => {
  try {
    const music = await musicModel.findById(req.params.musicId);

    if (!music) {
      return res.status(404).json({ success: false, error: "Track not found." });
    }
    if (music.artist.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "You do not have permission to delete this track." });
    }

    // Delete storage files concurrently (best-effort — don't block DB delete)
    await Promise.allSettled([
      music.audioFileId ? storageService.deleteFile(music.audioFileId) : Promise.resolve(),
      music.thumbnailFileId ? storageService.deleteFile(music.thumbnailFileId) : Promise.resolve(),
    ]);

    await musicModel.findByIdAndDelete(req.params.musicId);

    return res.status(200).json({ success: true, message: "Track deleted successfully." });
  } catch (err) {
    console.error("Delete Music Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to delete track. Please try again." });
  }
};

module.exports = { getImageKitAuth, createMusic, getAllMusics, deleteMusic };
