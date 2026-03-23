const postModel = require("./post.model");
const storageService = require("../../services/storage.service");

// ─── Create Post ──────────────────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { caption, isSecret } = req.body;

    if (!req.file && (!caption || !caption.trim())) {
      return res.status(400).json({
        success: false,
        error: "Post must have either an image or a caption.",
      });
    }

    let imageUrl;
    if (req.file) {
      const result = await storageService.uploadFromBuffer(req.file.buffer);
      imageUrl = result.url;
    }

    const post = await postModel.create({
      caption: caption?.trim() || "",
      user: req.user.id,
      isSecret: isSecret === "true" || isSecret === true,
      ...(imageUrl && { image: imageUrl }),
    });

    return res.status(201).json({ success: true, message: "Post created successfully.", post });
  } catch (err) {
    console.error("Create Post Error:", err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, error: Object.values(err.errors).map((e) => e.message).join(". ") });
    }
    if (err.message?.includes("upload") || err.message?.includes("ImageKit")) {
      return res.status(500).json({ success: false, error: "Image upload failed. Try a smaller file or different format." });
    }
    return res.status(500).json({ success: false, error: "Failed to create post. Please try again." });
  }
};

// ─── Get Feed ─────────────────────────────────────────────────────────────────
const getFeed = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");

    const [posts, total] = await Promise.all([
      postModel
        .find({ isSecret: { $ne: true } }) // Don't expose secret posts in feed
        .select("image caption user createdAt")
        .populate("user", "username profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      postModel.countDocuments({ isSecret: { $ne: true } }),
    ]);

    return res.status(200).json({
      success: true,
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get Feed Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to load feed. Please refresh." });
  }
};

// ─── Delete Post ──────────────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "You do not have permission to delete this post." });
    }

    await postModel.findByIdAndDelete(req.params.postId);

    return res.status(200).json({ success: true, message: "Post deleted successfully." });
  } catch (err) {
    console.error("Delete Post Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to delete post. Please try again." });
  }
};

module.exports = { createPost, getFeed, deletePost };
