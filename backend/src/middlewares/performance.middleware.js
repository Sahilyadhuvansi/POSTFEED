/**
 * MusicFeed Performance & Observability Middleware.
 * Tracks response times, throughput, and error rates.
 */
const logger = require("../utils/logger");

const performanceMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const duration = process.hrtime(start);
    const ms = (duration[0] * 1000 + duration[1] / 1e6).toFixed(2);
    const status = res.statusCode;

    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: status,
      latency: `${ms}ms`,
      userId: req.user?.id || "anonymous",
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    if (status >= 400) {
      console.error(`[Performance] ${req.method} ${req.originalUrl} - ERROR ${status} in ${ms}ms`);
      // Add more details to error logs
    } else if (ms > 500) {
      console.warn(`[Performance] ${req.method} ${req.originalUrl} - SLOW ${status} in ${ms}ms`);
    } else {
      console.info(`[Performance] ${req.method} ${req.originalUrl} - ${status} in ${ms}ms`);
    }
  });

  next();
};

module.exports = performanceMiddleware;
