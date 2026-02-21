const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const auth = require("../middlewares/auth.middleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protected - own profile (must be before /:id to avoid conflict)
router.get("/profile", auth, userController.getProfile);
router.put(
  "/profile",
  auth,
  upload.single("profilePic"),
  userController.updateProfile,
);
router.delete("/profile", auth, userController.deleteAccount);

// Public - get any user by ID
router.get("/:id", userController.getUserById);

module.exports = router;
