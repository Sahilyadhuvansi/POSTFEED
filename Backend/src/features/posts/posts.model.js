"use strict";

const mongoose = require("mongoose");

// ─── Commit: Core Post Schema Design ───
// What this does: Defines the data blueprint for every post in the system.
// Why it exists: Enforces consistency and structural integrity for social data.
// How it works: 
//   - 'user': Establishes a relationship (ref) with the 'user' model via MongoDB ObjectId.
//   - 'timestamps': Automatically manages 'createdAt' and 'updatedAt' for every document.
// Database queries: Aggregations and sorts rely on indexed fields for speed.
// Performance impact: 'index: true' on 'user' field makes profile feed lookups O(log n).
// Security considerations: 'isSecret' prevents unintended content sharing in controllers.
// Interview insight: Decoupling large binary data (images) into URLs prevents heavy MongoDB BSON overhead.
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
  },
  { timestamps: true },
);

// ─── Commit: Database Tuning (Indexing) ───
// These indexes optimize the two most common search patterns:
// 1. { createdAt: -1 }: The global newsfeed (most recent posts first).
// 2. { user: 1, createdAt: -1 }: A specific user's profile feed.
// Performance impact: Prevents full collection scans during feed loading.
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
