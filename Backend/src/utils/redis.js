"use strict";

const { createClient } = require("redis");
const logger = require("./logger");

/**
 * Shared Redis Client Utility
 */

let redisClient = null;

const getRedisClient = async () => {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    const client = createClient({ url });

    client.on("error", (err) => {
      logger.error("Redis Error", { error: err.message });
      // Don't throw, let it fail over to Map cache
    });

    client.on("connect", () => {
      logger.info("📡 Redis Connected", { url });
    });

    await client.connect();
    redisClient = client;
    return redisClient;
  } catch (err) {
    logger.warn("Redis Connection Failed. Falling back to in-memory cache.", { error: err.message });
    return null;
  }
};

module.exports = { getRedisClient };
