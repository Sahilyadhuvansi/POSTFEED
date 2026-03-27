const cluster = require("cluster");
const os = require("os");
const app = require("./index");
const logger = require("./common/utils/logger");

/**
 * PRODUCTION-GRADE CLUSTER (Advanced Horizontal Scaling)
 * What this does: Spawns worker processes using all available CPU cores.
 * Why it exists: A single Node core handles 1/Nth of potential capacity. 
 * Orchestration: The Master process (isPrimary) monitors and manages worker lifecycles.
 * Resilience: Auto-healing – if a worker crashes, the cluster forks a replacement instantly.
 */
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  logger.info(`🚀 MASTER: Orchestrating Cluster with ${numCPUs} CPU cores...`);

  // Spawn initial workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Graceful Restart: Handling signals on Primary process
  process.on("SIGTERM", () => {
    logger.warn("⚠️ MASTER: SIGTERM received. Closing Cluster workers gracefully...");
    for (const id in cluster.workers) {
      cluster.workers[id].send("shutdown");
    }
  });

  // Self-Healing
  cluster.on("exit", (worker, code, signal) => {
    if (signal !== "SIGTERM" && code !== 0) {
      logger.error(`❌ WORKER [${worker.process.pid}]: Crashed (${signal || code}). Reviving...`);
      cluster.fork();
    }
  });
} else {
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    logger.info(`✅ WORKER [${process.pid}]: Online at http://localhost:${PORT}`);
  });

  // Listen for shutdown signal from Primary
  process.on("message", (msg) => {
    if (msg === "shutdown") {
      logger.warn(`🛑 WORKER [${process.pid}]: Shutdown signal received. Closing connections...`);
      server.close(() => {
        logger.info(`👋 WORKER [${process.pid}]: Cleanup finished. Safe to exit.`);
        process.exit(0);
      });
      // Safety timeout for exit (10s max)
      setTimeout(() => process.exit(1), 10000);
    }
  });
  
  // Direct signal handling for individual workers (non-clustered fallback)
  const shutdown = () => {
    logger.warn(`🛑 SIGTERM received. Closing HTTP server...`);
    server.close(() => {
        logger.info(`👋 Cleanup finished. Safe to exit.`);
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
