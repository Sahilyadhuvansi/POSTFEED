const express = require("express");
const multer = require("multer");
const postController = require("./post.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

// ─── Commit: Managed File Uploads ───
// What this does: Configures Multer for in-memory handling of incoming multipart/form-data.
// Why it exists: Direct buffer processing via MemoryStorage is faster for tiny/moderate assets like post images.
// How it works: 
//   - limits: Restricts file size to 10MB to prevent memory exhaustion (DoS mitigation).
//   - fileFilter: Validates MIME-type to ensure only certain image formats are accepted.
// Security considerations: Denying large files and non-image formats prevents server-side payload attacks.
// Interview insight: Streams (DiskStorage) are better for huge files, while MemoryStorage is ideal for cloud-upload patterns.
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

// ─── Commit: Post Routing Tier ───
// What this does: Maps HTTP methods to specific controller functions.
// Pattern: RESTful API design.
// Details:
//   - POST /create: Protected by auth; handles single image upload with 'image' field name.
//   - DELETE /:postId: Protected; utilizes URL parameter for primary key access.
//   - GET /feed: Public; retrieves aggregated content with potential query param pagination.
router.post("/create", auth, upload.single("image"), postController.createPost);
router.delete("/:postId", auth, postController.deletePost);
router.get("/feed", postController.getFeed);

module.exports = router;
