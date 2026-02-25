const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,                  // 10 tentatives / 10 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." },
});

module.exports = { loginLimiter };