"use strict";

const postsModel = require("./posts.model");
const storageService = require("../../services/storage.service");
const ErrorResponse = require("../../utils/ErrorResponse");

// ─── Create Post ──────────────────────────────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { caption, isSecret, youtubeUrl, youtubeTitle, youtubeThumb } = req.body;

    if (!req.file && (!caption || !caption.trim()) && !youtubeUrl) {
      return next(new ErrorResponse("Post must have an image, a caption, or a song", 400));
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
      youtubeUrl,
      youtubeTitle,
      youtubeThumb,
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

// ─── Get Feed ─────────────────────────────────────────────────────────────────
const getFeed = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");

    const [posts, total] = await Promise.all([
      postsModel
        .find({ isSecret: { $ne: true } })
        .select("image caption user youtubeUrl youtubeTitle youtubeThumb createdAt")
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

// ─── Get Post By ID ──────────────────────────────────────────────────────────
const getPostById = async (req, res, next) => {
  try {
    const post = await postsModel
      .findById(req.params.postId)
      .select("image caption user youtubeUrl youtubeTitle youtubeThumb createdAt")
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

// ─── Delete Post ──────────────────────────────────────────────────────────────
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
