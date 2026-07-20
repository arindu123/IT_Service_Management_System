const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

module.exports = (req, res, next) => {
  const key = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    return res.status(429).json({ message: "Too many reset requests. Please try again later." });
  }
  recent.push(now);
  attempts.set(key, recent);
  next();
};
