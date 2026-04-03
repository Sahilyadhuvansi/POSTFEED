"use strict";

const mongoose = require("mongoose");
const postsModel = require("./posts.model");
const storageService = require("../../services/storage.service");
const ErrorResponse = require("../../utils/ErrorResponse");
const logger = require("../../utils/logger");

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

const toggleLike = async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const start = Date.now();

  try {
    // Senior: Use an atomic aggregation pipeline inside findOneAndUpdate to prevent race conditions
    // This handles the "toggle" logic (add if not present, remove if present) in a single DB round-trip
    const updatedPost = await postsModel.findOneAndUpdate(
      { _id: postId },
      [
        {
          $set: {
            isCurrentlyLiked: { $in: [new mongoose.Types.ObjectId(userId), "$likes"] }
          }
        },
        {
          $set: {
            likes: {
              $cond: [
                "$isCurrentlyLiked",
                { $filter: { input: "$likes", as: "l", cond: { $ne: ["$$l", new mongoose.Types.ObjectId(userId)] } } },
                { $concatArrays: ["$likes", [new mongoose.Types.ObjectId(userId)]] }
              ]
            },
            likeCount: {
              $cond: [
                "$isCurrentlyLiked",
                { $max: [0, { $subtract: ["$likeCount", 1] }] },
                { $add: ["$likeCount", 1] }
              ]
            }
          }
        },
        { $unset: "isCurrentlyLiked" }
      ],
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return next(new ErrorResponse("Post not found in the stream.", 404, "POST_NOT_FOUND"));
    }

    const isLiked = updatedPost.likes.some(id => id.toString() === userId);

    // Full observability: Log the atomic operation details
    logger.info({
      event: "post_like_toggle",
      postId,
      userId,
      isLiked,
      likeCount: updatedPost.likeCount,
      duration: Date.now() - start,
      requestId: req.id
    });

    return res.status(200).json({
      success: true,
      isLiked,
      likeCount: updatedPost.likeCount,
      requestId: req.id,
    });
  } catch (err) {
    logger.error({
      event: "post_like_error",
      postId,
      userId,
      error: err.message,
      requestId: req.id
    });
    next(err);
  }
};

module.exports = { createPost, getFeed, getPostById, deletePost, toggleLike };
