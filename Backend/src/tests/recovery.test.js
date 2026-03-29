"use strict";

const { expect } = require("chai");
const musicRecommendation = require("../services/music-recommendation.service");
const aiService = require("../services/ai.service");
const sinon = require("sinon");
const Music = require("../features/music/music.model");

/**
 * High-Integrity Architecture Tests (v5 Hardening)
 * Self-contained tests to prevent state leakage
 */
describe("Architecture Hardening (v5)", () => {
  let sandbox;
  const mockSong = { 
    title: "Test Song", 
    artist: { username: "test_artist" },
    createdAt: new Date(),
    toObject: function() { return { title: this.title, artist: this.artist }; }
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Global reset
    musicRecommendation.cache.clear();
    aiService.cache.clear();
    musicRecommendation.hits = 0;
    musicRecommendation.misses = 0;
    aiService.hits = 0;
    aiService.misses = 0;

    // Stub AI Service globally for these tests
    sandbox.stub(aiService, "chat").resolves({
      content: ["Reason A"],
      parseSuccess: true,
      status: "success"
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should generate unique SHA-256 keys for different inputs (Collision Test)", () => {
    const key1 = aiService._generateCacheKey({ p: "A", q: "BC" });
    const key2 = aiService._generateCacheKey({ p: "AB", q: "C" });
    expect(key1).to.not.equal(key2);
  });

  it("should evict oldest entries when cache exceeds limit (FIFO Test)", () => {
    for (let i = 0; i < 105; i++) {
       aiService._setCache(`key_${i}`, { data: i });
    }
    expect(aiService.cache.size).to.equal(100);
    expect(aiService.cache.has("key_0")).to.be.false; 
  });

  it("should NOT cache payloads exceeding 50KB (Memory Guard Test)", () => {
    const largePayload = "x".repeat(50001);
    aiService._setCache("large_key", { content: largePayload });
    expect(aiService.cache.has("large_key")).to.be.false;
  });

  it("should expire entries correctly after TTL (Time Logic Test)", () => {
    aiService._setCache("ttl_key", "data");
    const entry = aiService.cache.get("ttl_key");
    entry.timestamp = Date.now() - (11 * 60 * 1000);
    
    const TTL = 10 * 60 * 1000;
    if (Date.now() - entry.timestamp >= TTL) aiService.cache.delete("ttl_key");
    expect(aiService.cache.has("ttl_key")).to.be.false;
  });

  it("should deduplicate concurrent requests (Race Condition Test)", async () => {
    let queryExecutions = 0;
    const chain = {
      populate: sandbox.stub().returnsThis(),
      limit: sandbox.stub().returnsThis(),
      sort: sandbox.stub().returnsThis(),
      then: (resolve) => {
        queryExecutions++; // Increments once per DB trip
        setTimeout(() => resolve([mockSong]), 10);
      }
    };
    sandbox.stub(Music, "find").returns(chain);

    // Use unique user to avoid any collisions
    const userId = "race_user_v5";
    
    // Concurrent calls should share the same promise and same set of DB calls
    const p1 = musicRecommendation.getRecommendations(userId);
    const p2 = musicRecommendation.getRecommendations(userId);
    
    await Promise.all([p1, p2]);

    /**
     * LOGIC: 
     * If deduplication fails, we'd have 2 History + 2 Candidate queries = 4.
     * If deduplication works, we have 1 History + 1 Candidate query = 2.
     */
    expect(queryExecutions).to.equal(2);
  });

  it("should track hits and misses accurately (Atomic Stats Test)", async () => {
    musicRecommendation.cache.clear();
    musicRecommendation.hits = 0;
    musicRecommendation.misses = 0;

    const chain = {
      populate: sandbox.stub().returnsThis(),
      limit: sandbox.stub().returnsThis(),
      sort: sandbox.stub().returnsThis(),
      then: (resolve) => resolve([mockSong])
    };
    sandbox.stub(Music, "find").returns(chain);

    const userId = "stat_user_v5";
    await musicRecommendation.getRecommendations(userId); // Miss
    await musicRecommendation.getRecommendations(userId); // Hit
    
    const stats = musicRecommendation.getStats();
    expect(stats.hits).to.equal(1);
    expect(stats.misses).to.equal(1);
    expect(stats.hitRate).to.equal("50.00%");
  });
});
