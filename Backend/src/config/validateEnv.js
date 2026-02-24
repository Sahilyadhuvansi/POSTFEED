// CommonJS validator using envalid
const { cleanEnv, str, url, num } = require("envalid");

const env = cleanEnv(process.env, {
  // PORT handled as number to match Express expectations
  PORT: num({ default: 3001 }),

  // Required critical values
  MONGO_URI: str(),
  JWT_SECRET: str(),

  // Optional values with sensible defaults
  FRONTEND_URL: url({ default: "http://localhost:5001" }),
  CORS_ORIGINS: str({ default: "http://localhost:5173" }),
  DEFAULT_AVATAR: url({
    default: "https://www.gravatar.com/avatar/?d=mp&f=y&s=200",
  }),

  // ImageKit keys are optional strings (empty allowed)
  IMAGEKIT_PRIVATE_KEY: str({ default: "" }),
  IMAGEKIT_PUBLIC_KEY: str({ default: "" }),

  // IMPORTANT: url() requires a valid URL. Use str() if empty string is an acceptable default.
  IMAGEKIT_URL_ENDPOINT: str({ default: "" }),
});

module.exports = env;
