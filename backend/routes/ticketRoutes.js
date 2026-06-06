const express = require("express");

const {
  createTicket,
  getTickets,
  getTicketById,
  assignTechnician,
  updateTicketStatus,
} = require("../controllers/ticketController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All ticket routes protected
router.use(protect);

// Create ticket
router.post("/", createTicket);

// Get all tickets
router.get("/", getTickets);

// Get single ticket
router.get("/:id", getTicketById);

// Assign technician - admin only
router.put(
  "/:id/assign",
  authorizeRoles("admin"),
  assignTechnician
);

// Update ticket status - admin or technician
router.put(
  "/:id/status",
  authorizeRoles("admin", "technician"),
  updateTicketStatus
);

module.exports = router;