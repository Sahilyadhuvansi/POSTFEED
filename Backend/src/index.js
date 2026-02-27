require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const userRoutes = require("./routes/user.routes");
const musicRoutes = require("./routes/music.routes");
const validateEnv = require("./config/validateEnv");
const compression = require("compression");

console.log("Environment validated via envalid");

let dbError = null;

const app = express();

// Compression for responses (small, effective improvement)
app.use(compression());

connectDB().catch((err) => {
  console.error(" Database connection failed:", err.message);
  dbError = err.message;
  // Don't exit on Vercel - let health endpoint show the error
  // process.exit(1);
});

app.set("trust proxy", 1);

app.use(
  helmet.contentSecurityPolicy({
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
  }),
);

// HSTS (only in production)
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
    }),
  );
}

app.use(helmet.xContentTypeOptions());
app.use(helmet.xFrameOptions({ action: "SAMEORIGIN" }));
app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser requests (e.g., server-to-server) and same-origin
      if (!origin) return callback(null, true);

      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // During local development, allow any localhost origin (different dev ports)
      if (
        process.env.NODE_ENV !== "production" &&
        origin.startsWith("http://localhost")
      ) {
        console.log(`CORS: allowing localhost origin ${origin} in development`);
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
// Limit request body size to prevent large payload abuse
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Basic rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 to support bulk uploads
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "PostFeed and Music Backend is running!" });
});

app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbConnected = mongoose.connection.readyState === 1;
  const envValid = !!process.env.JWT_SECRET && !!process.env.MONGO_URI;

  if (dbConnected && envValid) {
    return res.status(200).json({
      status: "healthy",
      database: "connected",
      environment: "configured",
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: "unhealthy",
    database: dbConnected ? "connected" : "disconnected",
    environment: envValid ? "configured" : "missing_env_vars",
    issues: {
      dbConnected,
      jwtSecretSet: !!process.env.JWT_SECRET,
      mongoUriSet: !!process.env.MONGO_URI,
    },
    dbError: dbError || "connection in progress or no error captured",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/music", musicRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
