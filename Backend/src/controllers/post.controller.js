const postModel = require("../models/post.model");
const uploadFile = require("../services/storage.service");

exports.createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const { caption } = req.body;
    if (!caption) {
      return res.status(400).json({ message: "Caption is required" });
    }

    // Since we now have auth, the user ID is in req.user.id
    const post = await postModel.create({
      image: req.file.path || req.file.location, // Depends on storage config
      caption,
      user: req.user.id,
    });

    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating post" });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const posts = await postModel
      .find()
      .populate("user", "username")
      .sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ message: "Error fetching feed" });
  }
};
