const postsModel = require("./posts.model");
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
      const result = await storageService.uploadFromBuffer(
        req.file.buffer,
        req.file.originalname,
        "postfeed/images",
      );
      imageUrl = result.url;
    }

    const post = await postsModel.create({
      caption: caption?.trim() || "",
      user: req.user.id,
      isSecret: isSecret === "true" || isSecret === true,
      ...(imageUrl && { image: imageUrl }),
    });

    return res
      .status(201)
      .json({ success: true, message: "Post created successfully.", post });
  } catch (err) {
    console.error("Create Post Error:", err.message);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({
          success: false,
          error: "File too large. Maximum allowed size is 10MB.",
        });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: Object.values(err.errors)
          .map((e) => e.message)
          .join(". "),
      });
    }
    if (err.message?.includes("upload") || err.message?.includes("ImageKit")) {
      return res
        .status(500)
        .json({
          success: false,
          error: "Image upload failed. Try a smaller file or different format.",
        });
    }
    if (err.message?.includes("Only JPG") || err.message?.includes("allowed")) {
      return res.status(400).json({ success: false, error: err.message });
    }
    return res
      .status(500)
      .json({
        success: false,
        error: "Failed to create post. Please try again.",
      });
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
      postsModel
        .find({ isSecret: { $ne: true } }) // Don't expose secret posts in feed
        .select("image caption user createdAt")
        .populate("user", "username profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      postsModel.countDocuments({ isSecret: { $ne: true } }),
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
    return res
      .status(500)
      .json({ success: false, error: "Failed to load feed. Please refresh." });
  }
};

// ─── Get Post By ID ──────────────────────────────────────────────────────────
const getPostById = async (req, res) => {
  try {
    const post = await postsModel
      .findById(req.params.postId)
      .select("image caption user createdAt")
      .populate("user", "username profilePic")
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (err) {
    console.error("Get Post By Id Error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load post." });
  }
};

// ─── Delete Post ──────────────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await postsModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }
    if (post.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          error: "You do not have permission to delete this post.",
        });
    }

    await postsModel.findByIdAndDelete(req.params.postId);

    return res
      .status(200)
      .json({ success: true, message: "Post deleted successfully." });
  } catch (err) {
    console.error("Delete Post Error:", err.message);
    return res
      .status(500)
      .json({
        success: false,
        error: "Failed to delete post. Please try again.",
      });
  }
};

module.exports = { createPost, getFeed, getPostById, deletePost };
