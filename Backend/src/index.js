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
const postRoutes = require("./features/post/post.routes");
const userRoutes = require("./features/user/user.routes");
const musicRoutes = require("./features/music/music.routes");

// ─── Env Validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = ["JWT_SECRET", "MONGO_URI"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost")) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
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

// ─── Temporary Cleanup Endpoint ───────────────────────────────────────────────
app.get("/api/cleanup-tests", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");
    
    // Determine the exact name of the music collection
    const collections = await db.listCollections().toArray();
    let musicsCollection = db.collection("musics");
    if (collections.some(c => c.name === "music") && !collections.some(c => c.name === "musics")) {
      musicsCollection = db.collection("music");
    }

    // 1. Delete users with "test" in username
    const testUsersCursor = await usersCollection.find({ username: /test/i });
    const testUsers = await testUsersCursor.toArray();
    const userIds = testUsers.map(u => u._id);

    let deletedPosts = 0;
    let deletedMusic = 0;
    let deletedUsers = 0;

    if (userIds.length > 0) {
      const pRes = await postsCollection.deleteMany({ author: { $in: userIds } });
      deletedPosts += pRes.deletedCount;
      const mRes = await musicsCollection.deleteMany({ uploader: { $in: userIds } });
      deletedMusic += mRes.deletedCount;
      const uRes = await usersCollection.deleteMany({ _id: { $in: userIds } });
      deletedUsers += uRes.deletedCount;
    }

    // 2. Fallbacks
    const fallbackPRes = await postsCollection.deleteMany({ caption: /Testing post upload/i });
    deletedPosts += fallbackPRes.deletedCount;
    
    const fallbackMRes = await musicsCollection.deleteMany({ title: /test/i });
    deletedMusic += fallbackMRes.deletedCount;

    res.json({
      success: true,
      message: "Cleanup complete.",
      deleted: {
        users: deletedUsers,
        posts: deletedPosts,
        music: deletedMusic
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/posts", apiLimiter, postRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/music", apiLimiter, musicRoutes);

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
