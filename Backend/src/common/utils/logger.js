const pino = require("pino");

/**
 * PRODUCTION-GRADE LOGGER (Observability)
 * Features:
 * - Structured logging (JSON format for ELK/Prometheus)
 * - 'pino-pretty' for development legibility
 * - Log levels (info, debug, error, warn)
 * - Process ID inclusion for Cluster debugging
 */
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    pid: process.pid,
  },
});

module.exports = logger;
