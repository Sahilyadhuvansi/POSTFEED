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

// here this post like the collection of data of postschema with user information
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
