require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const userRoutes = require("./routes/user.routes");
const musicRoutes = require("./routes/music.routes");

const app = express();

connectDB().catch((err) => {
  console.error("Database connection failed:", err);
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

app.use(helmet.xContentTypeOptions());
app.use(helmet.xFrameOptions({ action: "SAMEORIGIN" }));
app.use(helmet.xXssProtection());
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
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
