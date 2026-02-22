const express = require("express");
const multer = require("multer");
const userController = require("../controllers/user.controller");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/profile", auth, userController.getProfile);
router.put(
  "/profile",
  auth,
  upload.single("profilePic"),
  userController.updateProfile,
);
router.delete("/profile", auth, userController.deleteAccount);

router.get("/:id", userController.getUserById);

module.exports = router;
