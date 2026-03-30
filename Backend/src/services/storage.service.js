// ─── Commit: Storage Service - Media Infrastructure ───
// What this does: Interfaces with ImageKit to handle file uploads and deletions.
// Why it exists: To offload binary file management to a specialized CDN and storage provider.
// How it works: Uses the ImageKit Node.js SDK with environment-based API keys.
// Beginner note: Storing images in a database is a bad idea; we store them in "The Cloud" and keep only the link in our DB.

"use strict";

const { ImageKit } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ─── Commit: Buffer-to-Cloud Upload ───
// What this does: Takes a raw file buffer (from Multer) and uploads it to ImageKit.
// How it works: Converts the buffer to a Base64 string before sending it over the wire.
// Interview insight: Buffers are more memory-efficient than temporary files for small-to-medium uploads.

async function uploadFromBuffer(buffer, originalName = "file", folder = "postfeed") {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  const uniqueName = `${folder.split("/").pop()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const result = await imagekit.files.upload({
    file: buffer.toString("base64"),
    fileName: uniqueName,
    folder,
  });
  return result;
}

// ─── Commit: idempotent File Deletion ───
// What this does: Removes a file from storage by its ID.
// Why it exists: To clean up orphaned files and save storage costs.
// How it works: Silently handles 404 errors so that a missing file doesn't crash the deletion logic.

async function deleteFile(fileId) {
  try {
    const result = await imagekit.files.delete(fileId);
    return result;
  } catch (error) {
    if (error?.statusCode === 404 || error?.message?.includes("not found")) {
      return null;
    }
    throw error;
  }
}

// ─── Commit: Client-Side Auth Generator ───
// What this does: Generates secure tokens for the frontend to upload directly.

function getAuthParams() {
  return imagekit.helper.getAuthenticationParameters();
}

module.exports = {
  uploadFromBuffer,
  deleteFile,
  getAuthParams,
};

