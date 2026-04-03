"use strict";

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    image: String,
    caption: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    youtubeUrl: String,
    youtubeTitle: String,
    youtubeThumb: String,
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

postSchema.index({ likeCount: -1 }); // Index for trending posts

// Index for sorting the feed; compound index supports per-user feeds too
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
