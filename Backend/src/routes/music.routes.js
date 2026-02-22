const express = require("express");
const musicController = require("../controllers/music.controller");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/imagekit-auth", auth, musicController.getImageKitAuth);
router.post("/", auth, musicController.createMusic);
router.delete("/:musicId", auth, musicController.deleteMusic);
router.get("/", musicController.getAllMusics);

module.exports = router;
