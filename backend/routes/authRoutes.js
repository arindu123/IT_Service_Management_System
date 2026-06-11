const express = require("express");
const {
  registerUser,
  loginUser,
  getUsers,
} = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Protected profile route
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Profile access successful",
    user: req.user,
  });
});

// Get all users - admin only
router.get("/users", protect, authorizeRoles("admin"), getUsers);

module.exports = router;
