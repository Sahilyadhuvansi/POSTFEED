"use strict";

const jwt = require("jsonwebtoken");

/**
 * authMiddleware — verifies JWT from httpOnly cookie OR Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid token. Please log in again.";
    return res.status(401).json({ success: false, error: message });
  }
};

module.exports = authMiddleware;
