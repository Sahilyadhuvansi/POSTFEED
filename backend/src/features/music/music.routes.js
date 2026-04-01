"use strict";

const express = require("express");
const musicController = require("./music.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", auth, musicController.createMusic);
router.delete("/:musicId", auth, musicController.deleteMusic);
router.get("/", musicController.getAllMusics);

module.exports = router;
