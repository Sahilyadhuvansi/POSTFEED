"use strict";

const express = require("express");
const musicController = require("./music.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", auth, musicController.createMusic);
router.post("/batch", auth, musicController.createMultipleMusic);
router.get("/mine", auth, musicController.getMyMusics);
router.delete("/:musicId", auth, musicController.deleteMusic);
router.get("/", musicController.getAllMusics);


module.exports = router;
