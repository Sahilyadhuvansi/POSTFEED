"use strict";

const mongoose = require("mongoose");
const { MONGO_URI } = require("./validateEnv");

/**
 * PRODUCTION DATABASE CONNECTION
 * Senior Refactor: Zero logs, atomic error propagation
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
