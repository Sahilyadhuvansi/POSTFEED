const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema(
  {
    audioUrl: {
      type: String,
      required: [true, "Audio URL is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Artist reference is required"],
      index: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    audioFileId: {
      type: String,
      required: [true, "Audio file ID is required"],
    },
    thumbnailFileId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }, // ← FIX: was missing — getAllMusics sorts by createdAt
);

// Index for feed sorting
musicSchema.index({ createdAt: -1 });

module.exports = mongoose.model("music", musicSchema);
