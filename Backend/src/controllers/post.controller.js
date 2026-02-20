const postModel = require("../models/post.model");
const uploadFile = require("../services/storage.service");

exports.createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    if (!caption) {
      return res.status(400).json({ message: "Caption is required" });
    }

    let imageUrl = null;

    // Upload image to ImageKit only if provided
    if (req.file) {
      const uploadResult = await uploadFile.uploadFromBuffer(req.file.buffer);
      imageUrl = uploadResult.url;
    }

    // Save to Database
    const post = await postModel.create({
      ...(imageUrl && { image: imageUrl }),
      caption,
      user: req.user.id,
      isSecret: req.body.isSecret === "true" || req.body.isSecret === true,
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
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ message: "Error fetching feed" });
  }
};
