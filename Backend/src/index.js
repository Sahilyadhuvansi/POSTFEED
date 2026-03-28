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
const { analyticsMiddleware } = require("./services/ai.performance-analytics");

// ─── Env Validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = ["JWT_SECRET", "MONGO_URI"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://postfeeds-xi.vercel.app", // Explicitly whitelist the production deployment
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow server-to-server or locally-set origins
    if (!origin) return cb(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => 
      origin === allowed || 
      (allowed.includes("*") && new RegExp(allowed.replace(/\*/g, ".*")).test(origin))
    );

    if (isAllowed) return cb(null, true);

    // Development fallback
    if (
      process.env.NODE_ENV !== "production" &&
      origin.startsWith("http://localhost")
    ) {
      return cb(null, true);
    }
    
    console.warn(`⚠️ Blocked by CORS: ${origin}. Approved: ${allowedOrigins.join(", ")}`);
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

app.set("trust proxy", 1);

// Connect DB (non-blocking for serverless)
let dbError = null;
connectDB().catch((err) => {
  console.error("Database connection failed:", err.message);
  dbError = err.message;
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors(corsOptions)); // CORS must be absolute first for preflight success
app.use(requestId); // Assign unique ID to every request
app.use(compression());
app.use(analyticsMiddleware); // Track AI performance globally
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
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
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
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
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developers
  const isProd = process.env.NODE_ENV === "production";
  console.error(`❌ [${err.statusCode || 500}] ${err.message}`);
  if (!isProd) console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(message.join(". "), 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
});

// ─── Start (dev only — Vercel handles its own serving) ───────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`),
  );
}

module.exports = app;
