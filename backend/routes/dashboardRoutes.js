const express = require("express");

const { getDashboardSummary } = require("../controllers/dashboardController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Dashboard summary - admin and management only
router.get(
  "/summary",
  protect,
  authorizeRoles("admin", "management"),
  getDashboardSummary
);

module.exports = router;