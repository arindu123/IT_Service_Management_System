const express = require("express");

const {
  createRepair,
  getRepairs,
  getRepairById,
  updateRepair,
  deleteRepair,
  getNextRepairRrNumber,
} = require("../controllers/repairController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All repair routes are protected
router.use(protect);

// Create repair - technician or admin
router.post("/", authorizeRoles("admin", "technician"), createRepair);

// Get all repairs
router.get("/", getRepairs);

// Get next RR number
router.get("/next-rr", authorizeRoles("admin", "technician"), getNextRepairRrNumber);

// Get single repair
router.get("/:id", getRepairById);

// Update repair - technician or admin
router.put("/:id", authorizeRoles("admin", "technician"), updateRepair);

// Delete repair - technician or admin
router.delete("/:id", authorizeRoles("admin", "technician"), deleteRepair);

module.exports = router;
