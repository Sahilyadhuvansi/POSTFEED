const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/register", upload.single("profilePic"), authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;
