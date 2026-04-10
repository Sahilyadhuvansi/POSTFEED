"use strict";

const Playlist = require("./playlists.model");
const ErrorResponse = require("../../utils/ErrorResponse");

const normalize = (value = "") => value.toString().trim();

const sanitizeTrack = (track = {}) => {
  const youtubeUrl = normalize(track.youtubeUrl);
  const title = normalize(track.title);

  if (!youtubeUrl || !title) return null;

  return {
    youtubeUrl,
    title,
    thumbnailUrl: normalize(track.thumbnailUrl) || null,
    addedAt: new Date(),
  };
};

const dedupeTracks = (tracks = []) => {
  const seen = new Set();
  return tracks.filter((track) => {
    if (!track?.youtubeUrl) return false;
    const key = track.youtubeUrl;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const ensureLikedSongsPlaylist = async (ownerId) => {
  let playlist = await Playlist.findOne({
    owner: ownerId,
    kind: "system_liked",
  });
  if (playlist) return playlist;

  playlist = await Playlist.create({
    owner: ownerId,
    name: "Liked Songs",
    kind: "system_liked",
    tracks: [],
  });

  return playlist;
};

const createPlaylist = async (req, res, next) => {
  try {
    const name = normalize(req.body?.name);
    if (!name) {
      return next(
        new ErrorResponse("Playlist name is required", 400, "VALIDATION_ERROR"),
      );
    }

    const existing = await Playlist.findOne({ owner: req.user.id, name });
    if (existing) {
      return next(
        new ErrorResponse(
          "Playlist name already exists",
          409,
          "DUPLICATE_PLAYLIST",
        ),
      );
    }

    const playlist = await Playlist.create({
      owner: req.user.id,
      name,
      kind: normalize(req.body?.kind) || "custom",
      externalSource: req.body?.externalSource || undefined,
      tracks: [],
    });

    return res.status(201).json({ success: true, playlist, requestId: req.id });
  } catch (err) {
    next(err);
  }
};

const getMyPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return res
      .status(200)
      .json({ success: true, playlists, requestId: req.id });
  } catch (err) {
    next(err);
  }
};

const getLikedSongsPlaylist = async (req, res, next) => {
  try {
    const liked = await ensureLikedSongsPlaylist(req.user.id);
    return res
      .status(200)
      .json({ success: true, playlist: liked, requestId: req.id });
  } catch (err) {
    next(err);
  }
};

const addTracksToPlaylist = async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    const tracksInput = Array.isArray(req.body?.tracks)
      ? req.body.tracks
      : req.body?.track
        ? [req.body.track]
        : [];

    if (!tracksInput.length) {
      return next(
        new ErrorResponse("No track payload provided", 400, "VALIDATION_ERROR"),
      );
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      owner: req.user.id,
    });
    if (!playlist) {
      return next(new ErrorResponse("Playlist not found", 404, "NOT_FOUND"));
    }

    const prepared = tracksInput.map(sanitizeTrack).filter(Boolean);
    if (!prepared.length) {
      return next(
        new ErrorResponse(
          "No valid tracks found in payload",
          400,
          "VALIDATION_ERROR",
        ),
      );
    }

    playlist.tracks = dedupeTracks([...(playlist.tracks || []), ...prepared]);
    await playlist.save();

    return res.status(200).json({
      success: true,
      message: `Added ${prepared.length} track(s) to ${playlist.name}`,
      playlist,
      requestId: req.id,
    });
  } catch (err) {
    next(err);
  }
};

const replacePlaylistTracks = async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    const tracksInput = Array.isArray(req.body?.tracks) ? req.body.tracks : [];

    if (!tracksInput.length) {
      return next(
        new ErrorResponse("No tracks provided", 400, "VALIDATION_ERROR"),
      );
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      owner: req.user.id,
    });
    if (!playlist) {
      return next(new ErrorResponse("Playlist not found", 404, "NOT_FOUND"));
    }

    const prepared = tracksInput.map(sanitizeTrack).filter(Boolean);
    playlist.tracks = dedupeTracks(prepared);
    await playlist.save();

    return res.status(200).json({
      success: true,
      message: `Playlist ${playlist.name} updated`,
      playlist,
      requestId: req.id,
    });
  } catch (err) {
    next(err);
  }
};

const removeTrackFromPlaylist = async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    const youtubeUrl = normalize(req.body?.youtubeUrl || req.query?.youtubeUrl);

    if (!youtubeUrl) {
      return next(
        new ErrorResponse("youtubeUrl is required", 400, "VALIDATION_ERROR"),
      );
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      owner: req.user.id,
    });
    if (!playlist) {
      return next(new ErrorResponse("Playlist not found", 404, "NOT_FOUND"));
    }

    const before = playlist.tracks.length;
    playlist.tracks = (playlist.tracks || []).filter(
      (t) => t.youtubeUrl !== youtubeUrl,
    );
    const removed = before - playlist.tracks.length;

    await playlist.save();

    return res.status(200).json({
      success: true,
      message: removed
        ? "Track removed from playlist"
        : "Track not present in playlist",
      removed,
      playlist,
      requestId: req.id,
    });
  } catch (err) {
    next(err);
  }
};

const renamePlaylist = async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    const name = normalize(req.body?.name);

    if (!name) {
      return next(
        new ErrorResponse(
          "New playlist name is required",
          400,
          "VALIDATION_ERROR",
        ),
      );
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      owner: req.user.id,
    });
    if (!playlist) {
      return next(new ErrorResponse("Playlist not found", 404, "NOT_FOUND"));
    }

    if (playlist.kind === "system_liked") {
      return next(
        new ErrorResponse(
          "Liked Songs playlist cannot be renamed",
          400,
          "READ_ONLY_PLAYLIST",
        ),
      );
    }

    playlist.name = name;
    await playlist.save();

    return res.status(200).json({ success: true, playlist, requestId: req.id });
  } catch (err) {
    next(err);
  }
};

const deletePlaylist = async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    const playlist = await Playlist.findOne({
      _id: playlistId,
      owner: req.user.id,
    });

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found", 404, "NOT_FOUND"));
    }

    if (playlist.kind === "system_liked") {
      return next(
        new ErrorResponse(
          "Liked Songs playlist cannot be deleted",
          400,
          "READ_ONLY_PLAYLIST",
        ),
      );
    }

    await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json({ success: true, message: "Playlist deleted", requestId: req.id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPlaylist,
  getMyPlaylists,
  getLikedSongsPlaylist,
  addTracksToPlaylist,
  replacePlaylistTracks,
  removeTrackFromPlaylist,
  renamePlaylist,
  deletePlaylist,
  ensureLikedSongsPlaylist,
};
