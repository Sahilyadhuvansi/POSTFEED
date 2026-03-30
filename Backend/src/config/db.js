// ─── Commit: Database Configuration and Connection ───
// What this does: Establishes a connection to MongoDB using Mongoose.
// Why it exists: To persist application data (users, posts, music) in a database.
// How it works: Uses mongoose.connect() with the MONGO_URI from the environment.
// Beginner note: Database connection is like plugging your computer into a power socket—it's what brings the static code to life with real data.

"use strict";

const mongoose = require("mongoose");
const { MONGO_URI } = require("./validateEnv");

/**
 * PRODUCTION DATABASE CONNECTION
 * Senior Refactor: Zero logs, atomic error propagation
 * 
 * What this does: Initializes the connection to MongoDB.
 * Why it exists: Centralizes DB connection logic and handles multiple calls efficiently.
 * How it works: Checks connection state first (readyState >= 1) to avoid redundant connections.
 * Interview insight: This is a 'Singleton-like' pattern for the database connection.
 */
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  if (!MONGO_URI) {
    throw new Error("CRITICAL: MONGO_URI environment variable is missing");
  }

  const conn = await mongoose.connect(MONGO_URI, {
    retryWrites: true,
    w: "majority",
    family: 4, // IPv4 fallback for stability
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  return conn;
}

module.exports = connectDB;

