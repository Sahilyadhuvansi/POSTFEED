/* eslint-disable */
// Test script for delete and upload flows
// This is a simulation, not a full e2e test

import axios from "axios";

const API_URL = "http://localhost:3001";

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
      withCredentials: true,
    });
    const musicId = uploadRes.data.music.id;
    console.log("Upload success:", uploadRes.data);

    // 2. Delete the uploaded music
    const deleteRes = await axios.delete(`${API_URL}/api/music/${musicId}`, {
      withCredentials: true,
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

// Run test
if (require.main === module) {
  testDeleteAndUpload();
}
