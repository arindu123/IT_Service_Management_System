const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      message: "Not authorized, token failed",
      error: error.message,
    });
  }
};

// Role based access
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied for this role",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};