const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const auth = require("../middlewares/auth.middleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/profile", auth, userController.getProfile);
router.put(
  "/profile",
  auth,
  upload.single("profilePic"),
  userController.updateProfile,
);

module.exports = router;
