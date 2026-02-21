const { ImageKit } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Upload from multer buffer
async function uploadFromBuffer(buffer) {
  const result = await imagekit.files.upload({
    file: buffer.toString("base64"),
    fileName: "postfeed_" + Date.now(),
    folder: "postfeed",
  });
  return result;
}

// Delete a file from ImageKit by its file ID
async function deleteFile(fileId) {
  try {
    const result = await imagekit.files.delete(fileId);
    return result;
  } catch (error) {
    // Ignore "file not found" errors — the file may already be deleted
    if (error?.statusCode === 404 || error?.message?.includes("not found")) {
      console.warn(`File ${fileId} not found in ImageKit, skipping delete.`);
      return null;
    }
    throw error;
  }
}

// Get auth params for client-side uploads
function getAuthParams() {
  return imagekit.helper.getAuthenticationParameters();
}

module.exports = {
  uploadFromBuffer,
  deleteFile,
  getAuthParams,
};
