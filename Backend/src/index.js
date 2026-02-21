require("dotenv").config();

// Set DNS before any network calls (needed for MongoDB Atlas SRV lookup)
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const userRoutes = require("./routes/user.routes");
const musicRoutes = require("./routes/music.routes");

const app = express();

// Connect to Database
connectDB().catch((err) => {
  console.error("Database connection failed:", err);
});

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5001",
      "http://localhost:5173",
      "https://postfeeds-xi.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Health Check
app.get("/", (req, res) => {
  res.status(200).json({ message: "PostFeed and Music Backend is running!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/music", musicRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

// Only listen locally — Vercel handles this in production
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
