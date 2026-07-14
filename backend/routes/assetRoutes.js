const express = require("express");

const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} = require("../controllers/assetController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

// Any signed-in user can register an asset.
router.post("/", createAsset);

// Get all assets
router.get("/", getAssets);

// Get single asset
router.get("/:id", getAssetById);

// Any signed-in user can update an asset.
router.put("/:id", updateAsset);

// Any signed-in user can delete an asset.
router.delete("/:id", deleteAsset);

module.exports = router;
