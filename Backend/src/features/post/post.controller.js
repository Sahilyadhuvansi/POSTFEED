const postModel = require("./post.model");
const storageService = require("../../services/storage.service");

// ─── Commit: Post Creation Logic ───
// What this does: Processes new post requests containing text and optional image buffers.
// Why it exists: Core user feature for sharing content in the PostFeed ecosystem.
// How it works: 
//   1. Validates presence of at least one content type (text/image).
//   2. If a file exists, it streams the buffer to ImageKit via storageService.
//   3. Saves the structured post metadata to MongoDB.
// Data flow: Client Multipart Data -> Multer Buffer -> Storage API -> MongoDB.
// Performance impact: Non-blocking I/O during upload; lean document creation.
// Security considerations: Strict ownership check; input truncation/trimming.
// Beginner note: 'isSecret' allows private content that won't show in global feed.
// Interview insight: Multiplexing text/file uploads requires handling multipart/form-data.
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
      const result = await storageService.uploadFromBuffer(req.file.buffer, req.file.originalname, "postfeed/images");
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
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "File too large. Maximum allowed size is 10MB." });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, error: Object.values(err.errors).map((e) => e.message).join(". ") });
    }
    if (err.message?.includes("upload") || err.message?.includes("ImageKit")) {
      return res.status(500).json({ success: false, error: "Image upload failed. Try a smaller file or different format." });
    }
    if (err.message?.includes("Only JPG") || err.message?.includes("allowed")) {
      return res.status(400).json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: "Failed to create post. Please try again." });
  }
};

// ─── Commit: Scalable Feed Fetching ───
// What this does: Retrieves a paginated list of public posts for the global feed.
// Why it exists: Primary consumption point for the social experience.
// How it works: Uses .skip() and .limit() for windowed retrieval; .populate() for user details.
// Data flow: Request Query Params -> MongoDB Query -> Lean JSON Response.
// Performance impact: High. .lean() skips Mongoose hydration; uses indexing on createdAt.
// Security considerations: Filters for 'isSecret: false' to prevent data leaks.
// Beginner note: 'setHeader' informs the browser it can cache this data for 30s.
// Interview insight: skip/limit is great for early scale, but cursor-based pagination is better for huge lists.
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

// ─── Commit: Secure Deletion ───
// What this does: Permanently removes a post from the database.
// Why it exists: User control and data privacy compliance.
// How it works: Verifies post existence and validates requester ownership.
// Security considerations: Essential 'req.user.id' comparison to prevent cross-user deletion.
// Performance impact: Low; single document O(1) indexed deletion.
// Interview insight: Real-world apps often use "Soft Deletes" to allow data recovery.
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
