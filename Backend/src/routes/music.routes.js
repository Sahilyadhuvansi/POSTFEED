const express = require("express");
const multer = require("multer");
const auth = require("../middlewares/auth.middleware");
const musicController = require("../controllers/music.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload music (any logged-in user)
router.post(
  "/",
  auth,
  upload.fields([{ name: "audioFile" }, { name: "thumbnail" }]),
  musicController.createMusic,
);

// Get all music tracks (public)
router.get("/", musicController.getAllMusics);

// Delete a music track (owner only)
router.delete("/:musicId", auth, musicController.deleteMusic);

module.exports = router;
