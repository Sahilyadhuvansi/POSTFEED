const mongoose = require("mongoose");

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return; // Already connected

  const conn = await mongoose.connect(process.env.MONGO_URI);

  console.log(
    `Connected to DB: ${conn.connection.host} / ${conn.connection.name}`,
  );
}

module.exports = connectDB;
