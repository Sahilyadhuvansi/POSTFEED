// ─── Commit: Posts Controller - Social Feed Management ───
// What this does: Handles the creation, retrieval, and deletion of social media posts.
// Why it exists: To allow users to share content and view a dynamic feed of posts.
// How it works: Interacts with the Posts Model and integrates with a Storage Service for image uploads.
// Beginner note: This is the "Engine" of the social feed, managing how data flows from the user to the database and back.

"use strict";

const postsModel = require("./posts.model");
const storageService = require("../../services/storage.service");
const ErrorResponse = require("../../utils/ErrorResponse");

// ─── Commit: Create Post Logic (Media + Text) ───
// What this does: Processes new posts, potentially including an image upload.
// Why it exists: To allow users to post both captions and visual media.
// How it works: Uses 'storageService' to upload images from a buffer before saving the post metadata.
// Interview insight: Decoupling metadata (DB) from binary data (Storage Bucket) is essential for scalability.

const createPost = async (req, res, next) => {
  try {
    const { caption, isSecret } = req.body;

    if (!req.file && (!caption || !caption.trim())) {
      return next(new ErrorResponse("Post must have either an image or a caption", 400));
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

    return res.status(201).json({ 
      success: true, 
      message: "Post created successfully", 
      post,
      requestId: req.id 
    });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ErrorResponse("File too large (Max 10MB)", 400));
    }
    next(err);
  }
};

// ─── Commit: Feed Retrieval (Pagination & Caching) ───
// What this does: Fetches a list of public posts with pagination support.
// Why it exists: To provide a performant way to browse content without overloading the client.
// How it works: Uses Mongoose .skip() and .limit() for offset-based pagination.
// Interview insight: Always include 'Cache-Control' headers for read-heavy feed endpoints to improve edge performance.

const getFeed = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");

    const [posts, total] = await Promise.all([
      postsModel
        .find({ isSecret: { $ne: true } })
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
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
};

// ─── Commit: Single Post Lookup ───
// What this does: Retrieves all details for a specific post by its unique ID.

const getPostById = async (req, res, next) => {
  try {
    const post = await postsModel
      .findById(req.params.postId)
      .select("image caption user createdAt")
      .populate("user", "username profilePic")
      .lean();

    if (!post) {
      return next(new ErrorResponse("Post not found", 404, "POST_NOT_FOUND"));
    }

    return res.status(200).json({ 
      success: true, 
      data: post,
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

// ─── Commit: Post Deletion (Authorization Check) ───
// What this does: Deletes a post while ensuring only the owner can do so.
// Why it exists: To maintain data ownership and security protocols.
// How it works: Compares the logged-in user ID with the post's author ID before proceeding.
// Beginner note: This is a classic example of "Resource-level Authorization".

const deletePost = async (req, res, next) => {
  try {
    const post = await postsModel.findById(req.params.postId);

    if (!post) {
      return next(new ErrorResponse("Post not found", 404, "POST_NOT_FOUND"));
    }
    
    if (post.user.toString() !== req.user.id) {
      return next(new ErrorResponse("You do not have permission to delete this post", 403, "FORBIDDEN"));
    }

    await postsModel.findByIdAndDelete(req.params.postId);

    return res.status(200).json({ 
      success: true, 
      message: "Post deleted successfully",
      requestId: req.id 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPost, getFeed, getPostById, deletePost };

