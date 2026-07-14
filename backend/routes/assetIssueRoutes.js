const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { issueItem, getIssues, returnItem } = require("../controllers/assetIssueController");

const router = express.Router();
router.use(protect);
router.get("/", getIssues);
router.post("/", authorizeRoles("admin", "system_admin", "head_of_it"), issueItem);
router.put("/:id/return", authorizeRoles("admin", "system_admin", "head_of_it"), returnItem);

module.exports = router;
