const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  destroyIssuedItem,
  getIssues,
  issueItem,
  returnItem,
  transferItem,
} = require("../controllers/assetIssueController");

const router = express.Router();
router.use(protect);
router.get("/", getIssues);
router.post("/", authorizeRoles("admin", "system_admin", "head_of_it"), issueItem);
router.put("/:id/return", authorizeRoles("admin", "system_admin", "head_of_it"), returnItem);
router.put("/:id/transfer", authorizeRoles("admin", "system_admin", "head_of_it"), transferItem);
router.put("/:id/destroy", authorizeRoles("admin", "system_admin", "head_of_it"), destroyIssuedItem);

module.exports = router;
