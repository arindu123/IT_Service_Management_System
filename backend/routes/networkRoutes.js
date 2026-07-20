const express = require("express");
const {
  createDevice,
  deleteDevice,
  getDeviceById,
  getDeviceHistory,
  getSummary,
  listDevices,
  listIncidents,
  manualCheckDevice,
  pauseDevice,
  resumeDevice,
  updateDevice,
} = require("../controllers/networkController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { networkRateLimit } = require("../middleware/securityRateLimit");

const router = express.Router();

const VIEW_MONITORING_ROLES = ["admin", "system_admin", "head_of_it", "technician", "management"];
const MANAGE_MONITORING_ROLES = ["admin", "system_admin", "head_of_it", "technician"];

router.use(protect);
router.use(networkRateLimit);

router.get("/summary", authorizeRoles(...VIEW_MONITORING_ROLES), getSummary);
router.get("/incidents", authorizeRoles(...VIEW_MONITORING_ROLES), listIncidents);
router.get("/devices", authorizeRoles(...VIEW_MONITORING_ROLES), listDevices);
router.post("/devices", authorizeRoles(...MANAGE_MONITORING_ROLES), createDevice);
router.get("/devices/:id/history", authorizeRoles(...VIEW_MONITORING_ROLES), getDeviceHistory);
router.post("/devices/:id/check", authorizeRoles(...MANAGE_MONITORING_ROLES), manualCheckDevice);
router.post("/devices/:id/pause", authorizeRoles(...MANAGE_MONITORING_ROLES), pauseDevice);
router.post("/devices/:id/resume", authorizeRoles(...MANAGE_MONITORING_ROLES), resumeDevice);
router.get("/devices/:id", authorizeRoles(...VIEW_MONITORING_ROLES), getDeviceById);
router.patch("/devices/:id", authorizeRoles(...MANAGE_MONITORING_ROLES), updateDevice);
router.delete("/devices/:id", authorizeRoles(...MANAGE_MONITORING_ROLES), deleteDevice);

module.exports = router;
