const mongoose = require("mongoose");

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    console.log("✅ Using existing database connection");
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: "majority",
    });

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`,
    );
    return conn;
  } catch (err) {
    console.error("❌ MongoDB Connection Failed");
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code}`);

    if (err.message.includes("ENOTFOUND")) {
      console.error("   → Check your MONGO_URI - host not found");
    } else if (err.message.includes("authentication failed")) {
      console.error("   → Check your MongoDB credentials in MONGO_URI");
    } else if (err.message.includes("connect ECONNREFUSED")) {
      console.error("   → MongoDB is not running or unreachable");
    }

    throw err;
  }
}

module.exports = connectDB;
