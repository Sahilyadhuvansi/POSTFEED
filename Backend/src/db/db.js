const mongoose = require("mongoose");

async function connectDB() {
  require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);

  const conn = await mongoose.connect(process.env.MONGO_URI);

  console.log(
    `Connected to DB: ${conn.connection.host} / ${conn.connection.name}`,
  );
}

module.exports = connectDB;
