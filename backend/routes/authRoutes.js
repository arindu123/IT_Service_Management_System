const express = require("express");
const {
  registerUser,
  loginUser,
  checkPasswordResetStatus,
  requestPasswordReset,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  cancelPasswordResetRequest,
  getResetTokenStatus,
  completePasswordReset,
  requestEmailPasswordReset,
  completeEmailPasswordReset,
  getUsers,
  updateUserRole,
} = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const passwordResetRateLimit = require("../middleware/passwordResetRateLimit");

const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Forgot password route
router.post("/forgot-password", passwordResetRateLimit, requestEmailPasswordReset);
router.post("/password-reset/check", checkPasswordResetStatus);
router.post("/password-reset/request", requestPasswordReset);
router.get("/password-reset/token/:token", getResetTokenStatus);
router.post("/password-reset/complete", completePasswordReset);
router.post("/reset-password/:token", completeEmailPasswordReset);

// Protected profile route
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Profile access successful",
    user: req.user,
  });
});

// Get all users - admin and head of IT only
router.get("/users", protect, authorizeRoles("admin", "system_admin", "head_of_it"), getUsers);

router.get(
  "/password-reset/requests",
  protect,
  authorizeRoles("admin", "system_admin", "head_of_it"),
  getPasswordResetRequests
);

router.put(
  "/password-reset/requests/:id/approve",
  protect,
  authorizeRoles("admin", "system_admin", "head_of_it"),
  approvePasswordResetRequest
);

router.put(
  "/password-reset/requests/:id/cancel",
  protect,
  authorizeRoles("admin", "system_admin", "head_of_it"),
  cancelPasswordResetRequest
);

// Update user role - admin and head of IT only
router.put("/role", protect, authorizeRoles("admin", "system_admin", "head_of_it"), updateUserRole);

module.exports = router;
