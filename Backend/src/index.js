require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const authRoutes = require("./features/auth/auth.routes");
const postRoutes = require("./features/post/post.routes");
const userRoutes = require("./features/user/user.routes");
const musicRoutes = require("./features/music/music.routes");
const aiRoutes = require("./features/ai/ai.routes");

// ─── Commit: Environment Hardening (Security Layer) ──────────────────────────
// What this does: Uses 'envalid' to strictly validate required environment vars.
// Why it exists: If the server starts with a missing JWT_SECRET or MONGO_URI, it's a security hole.
// Implementation: 'envalid' prevents the app from booting if types are incorrect.
const { cleanEnv, str, port, url } = require("envalid");
const env = cleanEnv(process.env, {
  JWT_SECRET: str(),
  MONGO_URI: str(),
  PORT: port({ default: 3001 }),
  FRONTEND_URL: url({ default: "http://localhost:5173" }),
  GROQ_API_KEY: str({ default: "" }),
  NODE_ENV: str({ choices: ["development", "test", "production"], default: "development" }),
});

// ─── App Initialization ───────────────────────────────────────────────────────
const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (!env.isProduction && origin.startsWith("http://localhost")) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.set("trust proxy", 1);

// Connect DB (non-blocking for serverless)
let dbError = null;
connectDB().catch((err) => {
  console.error("Database connection failed:", err.message);
  dbError = err.message;
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(compression());
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
    hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── HTTP Caching Middleware ──────────────────────────────────────────────────
// What this does: Sets Cache-Control headers for specific GET requests.
// Why it exists: To instruct the browser to store data, making navigations "Instant".
app.use((req, res, next) => {
  // Only cache GET requests that are likely to have stable content
  if (req.method === "GET" && 
      (req.url.includes("/api/posts/feed") || 
       req.url.includes("/api/music") || 
       req.url.includes("/api/ai/stats"))) {
    
    // Cache for 60 seconds (1 minute), allowing stale revalidation
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
  }
  next();
});

app.use(mongoSanitize());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter for login/register
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts. Please try again later." },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({ message: "PostFeed & Music API is running", version: "1.0.0" });
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
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  console.error(`❌ [${status}] ${err.message}`);
  if (!isProd) console.error(err.stack);
  res.status(status).json({
    success: false,
    error: isProd && status === 500 ? "Internal Server Error" : err.message,
  });
});

// ─── Start (dev only — Vercel handles its own serving) ───────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
