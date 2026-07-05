const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const {
  createTicket,
  getTickets,
  getMyTickets,
  markMyTicketUpdatesRead,
  getTicketById,
  assignTechnician,
  updateTicketStatus,
  acknowledgeTicket,
  rejectTicket,
  requestMoreInfo,
  uploadTicketAttachments,
  downloadEvidence,
  deleteEvidence,
  deleteTicket,
  updateTicket,
} = require("../controllers/ticketController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads", "tickets");

fs.mkdirSync(uploadDir, { recursive: true });

const allowedEvidenceTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const uploadEvidence = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedEvidenceTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, PDF, MP4, MOV and WebM evidence files are allowed"));
    }

    cb(null, true);
  },
});

const handleEvidenceUpload = (req, res, next) => {
  uploadEvidence.array("attachments", 5)(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    next();
  });
};

// All ticket routes protected
router.use(protect);

// Simple test routes
router.get("/testme", (req, res) => {
  res.json({ message: "Test single route works!" });
});

router.get("/testme/abc", (req, res) => {
  res.json({ message: "Test multi route works!" });
});

// Create ticket
router.post("/", createTicket);

// Get all tickets
router.get("/", getTickets);

// Get requests submitted by the signed-in user
router.get("/mine", getMyTickets);

// Mark signed-in user's request notifications as read
router.put("/mine/notifications/read", markMyTicketUpdatesRead);

// Download evidence file (must be before /:id route)
router.get("/:ticketId/attachments/:attachmentId/download", downloadEvidence);

// Delete evidence file
router.delete("/:ticketId/attachments/:attachmentId", deleteEvidence);

// Get single ticket
router.get("/:id", getTicketById);

// Upload supporting evidence
router.post(
  "/:id/attachments",
  handleEvidenceUpload,
  uploadTicketAttachments
);

// Head of IT review actions
router.put(
  "/:id/acknowledge",
  authorizeRoles("admin", "system_admin", "head_of_it"),
  acknowledgeTicket
);

router.put(
  "/:id/reject",
  authorizeRoles("admin", "system_admin", "head_of_it"),
  rejectTicket
);

router.put(
  "/:id/need-info",
  authorizeRoles("admin", "system_admin", "head_of_it", "technician"),
  requestMoreInfo
);

// Assign technician
router.put(
  "/:id/assign",
  authorizeRoles("admin", "system_admin", "head_of_it"),
  assignTechnician
);

// Update request status and fulfillment metadata
router.put(
  "/:id/status",
  authorizeRoles(
    "admin",
    "system_admin",
    "head_of_it",
    "technician",
    "store_keeper",
    "procurement_officer"
  ),
  updateTicketStatus
);

// Update ticket (by creator, for draft/submitted tickets)
router.put("/:id/update", updateTicket);

// Delete ticket (by creator, for draft/submitted tickets)
router.delete("/:id", deleteTicket);

module.exports = router;
