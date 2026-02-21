const postModel = require("../models/post.model");
const storageService = require("../services/storage.service");

const createPost = async (req, res) => {
  try {
    const { caption, isSecret } = req.body;

    // Validation
    if (!caption || caption.trim() === "") {
      return res.status(400).json({
        message: "Caption is required",
      });
    }

    let imageUrl;

    // Upload image only if file exists
    if (req.file) {
      const uploadResult = await storageService.uploadFromBuffer(
        req.file.buffer,
      );
      imageUrl = uploadResult.url;
    }

    // Create post object
    const postData = {
      caption: caption.trim(),
      user: req.user.id,
      isSecret: isSecret === "true" || isSecret === true,
    };

    if (imageUrl) {
      postData.image = imageUrl;
    }

    const post = await postModel.create(postData);

    return res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await postModel
      .find()
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Get Feed Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createPost,
  getFeed,
};
