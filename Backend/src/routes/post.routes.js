const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const auth = require("../middlewares/auth.middleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protected routes
router.post("/create", auth, upload.single("image"), postController.createPost);
router.get("/feed", postController.getFeed);

module.exports = router;
