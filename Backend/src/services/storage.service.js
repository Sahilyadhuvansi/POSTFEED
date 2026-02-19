const ImageKit = require("@imagekit/nodejs");
const fs = require("fs");

const imagekit = new ImageKit({
  publicKey: process.env.YOUR_PUBLIC_KEY,
  privateKey: process.env.YOUR_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// METHOD 1: Buffer Upload
async function uploadFromBuffer(buffer) {
    const result = await imagekit.upload({
        file: buffer.toString("base64"),
        fileName: "post.jpg",
    });
    return result;
}
// METHOD 2: File Upload
async function uploadFromFile(file) {
    const fileData = fs.readFileSync(file.path);
    const result = await imagekit.upload({
        file: fileData,
        fileName: file.originalname,
    });
    fs.unlinkSync(file.path); // Cleanup
    return result;
}
module.exports = {
    uploadFromBuffer,
    uploadFromFile,
};