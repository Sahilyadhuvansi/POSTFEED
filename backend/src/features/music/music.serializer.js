"use strict";

const serializeMusic = (music) => ({
  _id: music._id,
  id: music._id,
  youtubeUrl: music.youtubeUrl,
  title: music.title,
  thumbnailUrl: music.thumbnailUrl,
  artist: music.artist,
});

module.exports = { serializeMusic };
