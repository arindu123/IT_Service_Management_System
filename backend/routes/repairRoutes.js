const express = require("express");

const {
  createRepair,
  getRepairs,
  getRepairById,
  updateRepair,
} = require("../controllers/repairController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All repair routes are protected
router.use(protect);

// Create repair - technician or admin
router.post("/", authorizeRoles("admin", "technician"), createRepair);

// Get all repairs
router.get("/", getRepairs);

// Get single repair
router.get("/:id", getRepairById);

// Update repair - technician or admin
router.put("/:id", authorizeRoles("admin", "technician"), updateRepair);

module.exports = router;