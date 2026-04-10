"use strict";

const mongoose = require("mongoose");

const playlistTrackSchema = new mongoose.Schema(
  {
    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const playlistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    kind: {
      type: String,
      enum: ["custom", "system_liked", "imported"],
      default: "custom",
      index: true,
    },
    externalSource: {
      type: {
        type: String,
        enum: ["spotify", "youtube", null],
        default: null,
      },
      url: {
        type: String,
        default: null,
      },
    },
    tracks: {
      type: [playlistTrackSchema],
      default: [],
    },
  },
  { timestamps: true },
);

playlistSchema.index({ owner: 1, name: 1 }, { unique: true });
playlistSchema.index({ owner: 1, kind: 1 });

module.exports = mongoose.model("Playlist", playlistSchema);
