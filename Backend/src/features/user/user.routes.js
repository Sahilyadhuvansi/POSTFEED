const express = require("express");
const multer = require("multer");
const userController = require("./user.controller");
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

router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, upload.single("profilePic"), userController.updateProfile);
router.delete("/profile", auth, userController.deleteAccount);
router.get("/:id", userController.getUserById);

module.exports = router;
