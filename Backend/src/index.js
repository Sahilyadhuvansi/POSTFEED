"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./features/auth/auth.routes");
const postRoutes = require("./features/posts/posts.routes");
const userRoutes = require("./features/users/users.routes");
const musicRoutes = require("./features/music/music.routes");
const aiRoutes = require("./features/ai/ai.routes");
const ErrorResponse = require("./utils/ErrorResponse");
const requestId = require("./middlewares/request-id.middleware");
const errorHandler = require("./middlewares/error-handler.middleware");
const { analyticsMiddleware } = require("./services/ai.performance-analytics");

// ─── Env Status (Informational) ────────────────────────────────────────────────
const isConfigured = !!process.env.JWT_SECRET && !!process.env.MONGO_URI;
// Failure-resistant startup: Allow process to load for diagnostic /health endpoint

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://postfeeds-xi.vercel.app", // Public Production URL
  /\.vercel\.app$/,                 // Any Vercel subdomain (Production/Preview)
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

/**
 * CORS POLICY - Post Music AI (Production Refactor)
 * Senior Feature: Failure-resistant origin matching with wildcard support
 */
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      if (typeof allowed === "string") {
        return (
          origin === allowed ||
          (allowed.includes("*") &&
            new RegExp(allowed.replace(/\*/g, ".*")).test(origin))
        );
      }
      return false;
    });

    if (isAllowed) return cb(null, true);

    // Development fallback for local loopback
    if (
      process.env.NODE_ENV !== "production" &&
      (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))
    ) {
      return cb(null, true);
    }

    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With", 
    "Accept",
    "X-Request-Id" // Ensure our new production tracing header is allowed
  ],
  exposedHeaders: ["X-Request-Id"] // Expose tracing header to the frontend
};

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

app.set("trust proxy", true); // Fully trust Vercel's proxy chain for IPv4/IPv6 client identification

// Connect DB (non-blocking for serverless)
let dbError = null;
connectDB().catch((err) => {
  dbError = err.message;
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors(corsOptions)); // CORS must be absolute first for preflight success
app.use(requestId); // FIRST: Assign unique ID to every request
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(analyticsMiddleware); // Track AI performance post-parsing

// ─── Rate Limiting ────────────────────────────────────────────────────────────
/**
 * Safe client identifier for distributed environments (Vercel/Cloudflare)
 */
const keyGenerator = (req) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "anonymous";
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator, // v6: Robust IPv6 support for Vercel
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter for login/register
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator, // v6: Robust IPv6 support for Vercel
  message: {
    success: false,
    error: "Too many auth attempts. Please try again later.",
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res
    .status(200)
    .json({ message: "PostFeed & Music API is running", version: "1.0.0" });
});

app.get("/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const envValid = !!process.env.JWT_SECRET && !!process.env.MONGO_URI;
  const healthy = dbConnected && envValid;

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "unhealthy",
    database: dbConnected ? "connected" : "disconnected",
    environment: envValid ? "configured" : "missing_env_vars",
    ...(dbError && { dbError }),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/posts", apiLimiter, postRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/music", apiLimiter, musicRoutes);
app.use("/api/ai", apiLimiter, aiRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start (dev only — Vercel handles its own serving) ───────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT);
}

module.exports = app;
