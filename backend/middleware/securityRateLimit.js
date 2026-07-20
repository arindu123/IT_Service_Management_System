const { rateLimit } = require("express-rate-limit");

const makeLimiter = (limit, message) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message },
});

module.exports = {
  loginRateLimit: makeLimiter(10, "Too many login attempts. Please try again later."),
  registrationRateLimit: makeLimiter(10, "Too many registration attempts. Please try again later."),
  passwordResetRateLimit: makeLimiter(5, "Too many password reset attempts. Please try again later."),
  networkRateLimit: makeLimiter(120, "Too many network monitoring requests. Please try again later."),
};
