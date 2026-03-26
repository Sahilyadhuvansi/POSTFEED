const express = require("express");
const multer = require("multer");
const postController = require("./post.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

// Strict file validation: 10MB max, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed."));
    }
  },
});

router.post("/create", auth, upload.single("image"), postController.createPost);
router.delete("/:postId", auth, postController.deletePost);
router.get("/feed", postController.getFeed);

module.exports = router;
