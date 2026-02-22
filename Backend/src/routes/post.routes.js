const express = require("express");
const multer = require("multer");
const postController = require("../controllers/post.controller");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create", auth, upload.single("image"), postController.createPost);
router.delete("/:postId", auth, postController.deletePost);
router.get("/feed", postController.getFeed);

module.exports = router;
