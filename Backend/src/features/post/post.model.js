const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    image: String,
    caption: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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

// Index for sorting the feed; compound index supports per-user feeds too
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
