const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema({
  uri: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  thumbnail: {
    type: String,
    default: null,
  },
  audioFileId: {
    type: String,
    required: true,
  },
  thumbnailFileId: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("music", musicSchema);
