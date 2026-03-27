const { createClient } = require("redis");
const logger = require("../utils/logger");

/**
 * PRODUCTION-GRADE SHARED CACHE (Redis / In-Memory Hybrid)
 * Features:
 * - Cluster Mode Sharing: Redis enables shared state across Cluster workers.
 * - Automatic Fallback: Use Local 'Map()' if Redis is unavailable (Portability).
 * - TTL Management: Time-to-live for data expiration.
 */
class CacheService {
  constructor() {
    this.redisClient = null;
    this.localCache = new Map();
    this.isUsingRedis = false;
    this._init();
  }

  async _init() {
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        this.redisClient = createClient({
          url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:6379`,
        });

        this.redisClient.on("error", (err) => {
          logger.error("❌ CACHE: Redis client error, falling back to Local Map:", err.message);
          this.isUsingRedis = false;
        });

        await this.redisClient.connect();
        logger.info("✅ CACHE: Shared Redis cache connected (Optimal for Cluster Scaling)");
        this.isUsingRedis = true;
      } catch (error) {
        logger.warn("⚠️ CACHE: Redis unavailable. Using Local In-Memory Cache (Not shared across workers).");
      }
    }
  }

  async get(key) {
    if (this.isUsingRedis && this.redisClient) {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
    const cached = this.localCache.get(key);
    if (cached && Date.now() < cached.expiry) return cached.value;
    return null;
  }

  async set(key, value, ttlSeconds = 3600) {
    if (this.isUsingRedis && this.redisClient) {
      await this.redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
      return;
    }
    this.localCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key) {
    if (this.isUsingRedis && this.redisClient) {
      await this.redisClient.del(key);
      return;
    }
    this.localCache.delete(key);
  }
}

module.exports = new CacheService();
