const express = require("express");
const auth = require("../middlewares/auth.middleware");
const musicController = require("../controllers/music.controller");

const router = express.Router();

// Get ImageKit auth params for client-side upload
router.get("/imagekit-auth", auth, musicController.getImageKitAuth);

// Save music metadata after client-side upload (any logged-in user)
router.post("/", auth, musicController.createMusic);

// Get all music tracks (public)
router.get("/", musicController.getAllMusics);

// Delete a music track (owner only)
router.delete("/:musicId", auth, musicController.deleteMusic);

module.exports = router;
