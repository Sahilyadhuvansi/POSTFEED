// Test script for delete and upload flows (CommonJS)
const axios = require("axios");
const jwt = require("jsonwebtoken");

const API_URL = "http://localhost:3001";
const JWT_SECRET = "c4ba70682acadfa405a115ddd3536178f99f5e6c432fbb42";
const userId = "699995da5a04c6d3c174d354";
const username = "SAHIL";

function getAuthCookie() {
  const token = jwt.sign({ id: userId, username }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return `token=${token}`;
}

async function testDeleteAndUpload() {
  try {
    // 1. Upload a dummy music
    const dummyMusic = {
      title: "Test Track",
      audioUrl: "https://example.com/test.mp3",
      audioFileId: "dummy-audio-id",
      thumbnailUrl: "https://example.com/test.jpg",
      thumbnailFileId: "dummy-thumb-id",
    };
    const uploadRes = await axios.post(`${API_URL}/api/music`, dummyMusic, {
      headers: { Cookie: getAuthCookie() },
    });
    const musicId = uploadRes.data.music.id;
    console.log("Upload success:", uploadRes.data);

    // 2. Delete the uploaded music
    const deleteRes = await axios.delete(`${API_URL}/api/music/${musicId}`, {
      headers: { Cookie: getAuthCookie() },
    });
    console.log("Delete success:", deleteRes.data);

    // 3. Refetch music list
    const listRes = await axios.get(`${API_URL}/api/music?page=1&limit=10`);
    const found = listRes.data.musics.find((m) => m._id === musicId);
    if (!found) {
      console.log("Music deleted and not found in list.");
    } else {
      console.error("Music still present after delete!");
    }
  } catch (err) {
    console.error("Test error:", err.response?.data || err.message);
  }
}

if (require.main === module) {
  testDeleteAndUpload();
}
