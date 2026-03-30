// ─── Commit: Node.js Cluster Orchestration ───
// What this does: Spawns worker processes using all available CPU cores for horizontal scaling.
// Why it exists: To leverage multi-core CPUs, as a single Node.js instance stays on a single core.
// How it works: uses the cluster module to fork workers from a main process.
// Beginner note: Imagine your CPU as a multi-lane highway; clustering lets you use every lane instead of just one!

const cluster = require("cluster");
const os = require("os");
const app = require("./index");
const logger = require("./common/utils/logger");

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  // ─── Commit: Cluster Primary Process Logic ───
  // What this does: Manages the lifecycle of multiple worker processes.
  // Why it exists: If a single process fails, the master can restart it instantly (Resilience).
  // How it works: Uses cluster.fork() in a loop to create workers.
  // Interview insight: This is a "Shared-Nothing" architecture where workers don't share memory.

  logger.info(`🚀 MASTER: Orchestrating Cluster with ${numCPUs} CPU cores...`);

  // Spawn initial workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // ─── Commit: Cluster Self-Healing Logic ───
  // What this does: Monitors workers and restarts them if they crash.
  // Why it exists: Ensures high availability (Production Standard).
  // How it works: Listens for 'exit' events and forks a new worker if the exit code is non-zero.

  process.on("SIGTERM", () => {
    logger.warn("⚠️ MASTER: SIGTERM received. Closing Cluster workers gracefully...");
    for (const id in cluster.workers) {
      cluster.workers[id].send("shutdown");
    }
  });

  cluster.on("exit", (worker, code, signal) => {
    if (signal !== "SIGTERM" && code !== 0) {
      logger.error(`❌ WORKER [${worker.process.pid}]: Crashed (${signal || code}). Reviving...`);
      cluster.fork();
    }
  });
} else {
  // ─── Commit: Worker Process HTTP Server ───
  // What this does: Listens for incoming HTTP traffic on a specific port.
  // Why it exists: To actually serve API requests using the Express app.
  // How it works: Worker calls app.listen() to start its own HTTP server.
  // Interview insight: Port sharing is handled by the cluster module at the OS level.

  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    logger.info(`✅ WORKER [${process.pid}]: Online at http://localhost:${PORT}`);
  });

  process.on("message", (msg) => {
    if (msg === "shutdown") {
      logger.warn(`🛑 WORKER [${process.pid}]: Shutdown signal received. Closing connections...`);
      server.close(() => {
        logger.info(`👋 WORKER [${process.pid}]: Cleanup finished. Safe to exit.`);
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    }
  });
  
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

