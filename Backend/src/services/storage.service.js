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

module.exports = {
  uploadFromBuffer,
};
