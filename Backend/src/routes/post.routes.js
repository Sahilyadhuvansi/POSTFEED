const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const auth = require("../middlewares/auth.middleware");
const multer = require("multer");
const diskUpload = multer({ dest: "uploads/" });

// Protected routes
router.post(
  "/create",
  auth,
  diskUpload.single("image"),
  postController.createPost,
);
router.get("/feed", postController.getFeed);

module.exports = router;
