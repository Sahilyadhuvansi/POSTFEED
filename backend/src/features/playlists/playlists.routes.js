"use strict";

const express = require("express");
const auth = require("../../middlewares/auth.middleware");
const playlistsController = require("./playlists.controller");

const router = express.Router();

router.use(auth);

router.post("/", playlistsController.createPlaylist);
router.get("/mine", playlistsController.getMyPlaylists);
router.get("/liked", playlistsController.getLikedSongsPlaylist);
router.patch("/:playlistId", playlistsController.renamePlaylist);
router.delete("/:playlistId", playlistsController.deletePlaylist);
router.post("/:playlistId/tracks", playlistsController.addTracksToPlaylist);
router.put("/:playlistId/tracks", playlistsController.replacePlaylistTracks);
router.delete(
  "/:playlistId/tracks",
  playlistsController.removeTrackFromPlaylist,
);

module.exports = router;
