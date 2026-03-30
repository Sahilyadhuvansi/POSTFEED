/**
 * POSTFEED: HIGH-CONCURRENCY BURST TEST (v5)
 * Purpose: Verifies the "Immediate Promise Caching" logic under artificial heavy load.
 * 
 * Target: 50 Concurrent Requests
 * Expected Result: 
 * - Only 1 real execution of the database/AI logic.
 * - 49 Cache Hits (reusing the same promise).
 * - Stable response times (< 100ms for cached hits).
 */

const http = require('http');

const CONFIG = {
  host: 'localhost',
  port: 5000, 
  endpoint: '/api/ai/recommendations',
  concurrency: 50,
  authToken: process.argv[2] || 'REPLACE_WITH_VALID_TOKEN'
};

const stats = {
  total: 0,
  success: 0,
  error: 0,
  times: []
};

async function fireBurst() {
  console.log(`\n🔥 Starting High-Concurrency Burst Test...`);
  console.log(`📡 Target: ${CONFIG.host}:${CONFIG.port}${CONFIG.endpoint}`);
  console.log(`⚡ Concurrency: ${CONFIG.concurrency} simultaneous requests\n`);

  const startTime = Date.now();
  const requests = Array.from({ length: CONFIG.concurrency }).map((_, i) => makeRequest(i));

  await Promise.all(requests);

  const duration = Date.now() - startTime;
  const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;

  console.log(`\n✅ TEST COMPLETE`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total Requests : ${stats.total}`);
  console.log(`Successes      : ${stats.success}`);
  console.log(`Errors         : ${stats.error}`);
  console.log(`Avg Latency    : ${avgTime.toFixed(2)}ms`);
  console.log(`Total Duration : ${duration}ms`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📍 NEXT STEP: Check /api/ai/stats to verify only 1 cache miss occurred.\n`);
}

function makeRequest(id) {
  return new Promise((resolve) => {
    const start = Date.now();
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: CONFIG.endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.authToken}`
      }
    };

    const req = http.request(options, (res) => {
      stats.total++;
      if (res.statusCode === 200) {
        stats.success++;
      } else {
        stats.error++;
      }
      stats.times.push(Date.now() - start);
      
      // Consume response data to free up memory
      res.on('data', () => {});
      res.on('end', () => resolve());
    });

    req.on('error', (e) => {
      stats.total++;
      stats.error++;
      resolve();
    });

    req.end();
  });
}

if (require.main === module) {
  if (CONFIG.authToken === 'REPLACE_WITH_VALID_TOKEN' && !process.env.TEST_MODE) {
    console.error('❌ Error: Please provide a valid JWT token as an argument.');
    console.log('Usage: node scripts/burst-test.js <TOKEN>');
    process.exit(1);
  }
  fireBurst();
}
