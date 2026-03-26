const express = require("express");
const { register, login, logout, getMe } = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout); // require auth so only logged-in users can logout
router.get("/me", authMiddleware, getMe); // session rehydration on page load

module.exports = router;
