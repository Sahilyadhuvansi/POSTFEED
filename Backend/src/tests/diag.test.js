const { expect } = require("chai");
const musicRecommendation = require("../services/music-recommendation.service");
const aiService = require("../services/ai.service");
const sinon = require("sinon");
const Music = require("../features/music/music.model");

/**
 * Diagnostic Architecture Tests
 */
describe("Architecture Hardening (v5) Diagnostics", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    musicRecommendation.cache.clear();
    musicRecommendation.hits = 0;
    musicRecommendation.misses = 0;
    
    // Stub Mongoose
    const chain = {
      populate: sandbox.stub().returnsThis(),
      limit: sandbox.stub().returnsThis(),
      sort: sandbox.stub().returnsThis(),
      then: (resolve) => resolve([])
    };
    sandbox.stub(Music, "find").returns(chain);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should verify atomic stats increment logic", async () => {
    const userId = "diag_user";
    
    // Initial state
    expect(musicRecommendation.hits).to.equal(0);
    expect(musicRecommendation.misses).to.equal(0);
    
    // 1st call
    await musicRecommendation.getRecommendations(userId);
    expect(musicRecommendation.misses).to.equal(1);
    expect(musicRecommendation.hits).to.equal(0);
    
    // 2nd call
    await musicRecommendation.getRecommendations(userId);
    expect(musicRecommendation.hits).to.equal(1);
    expect(musicRecommendation.misses).to.equal(1);
  });
});
