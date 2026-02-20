require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");

// Connect to Database
connectDB().catch((err) => {
  console.error("Database connection failed:", err);
});

// Only listen if not running in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
