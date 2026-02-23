const postModel = require("../models/post.model");
const storageService = require("../services/storage.service");

const createPost = async (req, res) => {
  try {
    const { caption, isSecret } = req.body;

    // Validation
    if (!req.file && (!caption || caption.trim() === "")) {
      return res.status(400).json({
        success: false,
        error: "Post must have either an image or a caption.",
      });
    }

    let imageUrl;

    // Upload image only if file exists
    if (req.file) {
      const uploadResult = await storageService.uploadFromBuffer(
        req.file.buffer,
      );
      imageUrl = uploadResult.url;
    }

    // Create post object
    const postData = {
      caption: caption.trim(),
      user: req.user.id,
      isSecret: isSecret === "true" || isSecret === true,
    };

    if (imageUrl) {
      postData.image = imageUrl;
    }

    const post = await postModel.create(postData);

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create Post Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, error: messages.join(". ") });
    }

    if (
      error.message?.includes("ImageKit") ||
      error.message?.includes("upload")
    ) {
      return res.status(500).json({
        success: false,
        error:
          "Failed to upload image. The file may be too large or in an unsupported format.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create post. Please try again.",
    });
  }
};

const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await postModel
      .find()
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Get Feed Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load feed. Please refresh the page.",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this post.",
      });
    }

    await postModel.findByIdAndDelete(req.params.postId);

    return res
      .status(200)
      .json({ success: true, message: "Post deleted successfully." });
  } catch (error) {
    console.error("Delete Post Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete post. Please try again.",
    });
  }
};

module.exports = {
  createPost,
  getFeed,
  deletePost,
};
