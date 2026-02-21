const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  image: String,
  caption: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  isSecret: {
    type: Boolean,
    default: false,
  },
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
