const express = require("express");
const multer = require("multer");
const usersController = require("./users.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

// Limit file size to 5MB and only allow images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed."));
    }
  },
});

router.get("/profile", auth, usersController.getProfile);
router.put("/profile", auth, upload.single("profilePic"), usersController.updateProfile);
router.delete("/profile", auth, usersController.deleteAccount);
router.get("/:id", usersController.getUserById);

module.exports = router;
