const express = require("express");

const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} = require("../controllers/assetController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

// Create asset - admin only
router.post("/", authorizeRoles("admin"), createAsset);

// Get all assets
router.get("/", getAssets);

// Get single asset
router.get("/:id", getAssetById);

// Update asset - admin only
router.put("/:id", authorizeRoles("admin"), updateAsset);

// Delete asset - admin only
router.delete("/:id", authorizeRoles("admin"), deleteAsset);

module.exports = router;