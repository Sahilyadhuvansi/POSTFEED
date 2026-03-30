// ─── Commit: Core Framework and Security Imports ───
// What this does: Imports essential libraries for the Express application.
// Why it exists: Helmet for security, CORS for cross-origin requests, Mongoose for DB, etc.
// How it works: Uses require() to load installed npm packages.
// Beginner note: Think of this as gathering all your specialized tools before starting a construction project.

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

// ─── Commit: Environment State Check ───
// What this does: Verifies if critical environment variables are loaded.
// Why it exists: Prevents the application from running in a broken state if secrets are missing.
// How it works: Simple boolean check using logical AND (&&).
// Interview insight: Always validate env vars early to ensure "Fail-Fast" behavior.

const isConfigured = !!process.env.JWT_SECRET && !!process.env.MONGO_URI;

// ─── Commit: CORS Configuration ───
// What this does: Defines which domains are allowed to access this API.
// Why it exists: Browser security (SOP) blocks requests from different domains unless CORS headers are present.
// How it works: Uses an array of strings and regex to match the 'Origin' header.
// Beginner note: It's like a guest list for a private party. Only those on the list get in.

const allowedOrigins = [
  "https://postfeeds-xi.vercel.app", 
  /\.vercel\.app$/,                 
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

/**
 * CORS options logic for matching origins dynamically.
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
    "X-Request-Id" 
  ],
  exposedHeaders: ["X-Request-Id"], 
  maxAge: 86400 
};

// ─── Commit: Express App and Database Initialization ───
// What this does: Initializes the Express application and establishes DB connection.
// Why it exists: express() starts the framework; connectDB() connects to MongoDB.
// How it works: connectDB is an async function called without blocking the main thread.
// Interview insight: Modern cloud apps often connect to DB asynchronously to speed up cold starts.

const app = express();

app.set("trust proxy", true); 

let dbError = null;
connectDB().catch((err) => {
  dbError = err.message;
});

// ─── Commit: Middleware Pipeline ───
// What this does: Configures a sequence of functions that process every request.
// Why it exists: To handle security (Helmet), parsing (JSON), and logging (Morgan).
// How it works: app.use() adds functions to the Express middleware stack.
// Beginner note: Think of this as an assembly line where each station adds or checks something on the product.

app.use(cors(corsOptions)); 
app.use(requestId); 
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "'unsafe-inline'", "https:"],
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
app.use(analyticsMiddleware); 

// ─── Commit: API Rate Limiting ───
// What this does: Limits the number of requests a single user can make.
// Why it exists: Protects against Brute Force attacks and API abuse (DoS).
// How it works: Tracks the IP address and increments a counter per windowMs.
// Interview insight: Always use a 'keyGenerator' that understands proxies (X-Forwarded-For).

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
  keyGenerator, 
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator, 
  message: {
    success: false,
    error: "Too many auth attempts. Please try again later.",
  },
});

// ─── Commit: Application Routing ───
// What this does: Maps URL paths to specific feature logic.
// Why it exists: To keep the codebase organized by separating concerns (auth, music, ai).
// How it works: app.use() attaches router objects to specific path prefixes.
// Beginner note: It's like the GPS of your app—telling requests where to go based on the destination.

app.get("/", (_req, res) => {
  res
    .status(200)
    .json({ message: "PostFeed & Music API is running", version: "1.0.0" });
});

app.get("/api/health", (_req, res) => {
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

// ─── Commit: Global Error Handling ───
// What this does: Catches all errors and 404s in one central place.
// Why it exists: Ensures the app doesn't crash and returns consistent JSON error messages.
// How it works: The last two middlewares catch unhandled routes and thrown errors.
// Interview insight: Centralized error handling is crucial for logging and production monitoring.

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

// ─── Commit: Server Ignition ───
// What this does: Starts the server on a specific port for local development.
// Why it exists: Vercel is serverless, but we need a local listener to code and test.
// How it works: app.listen() opens a socket to listen for incoming HTTP traffic.

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    // console.log(`PostFeed Backend running locally on port ${PORT}`);
  });
}

module.exports = app;

