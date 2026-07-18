const express = require("express");

const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  destroyAsset,
  deleteAsset,
} = require("../controllers/assetController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

// Any signed-in user can register an asset.
router.post("/", createAsset);

// Get all assets
router.get("/", getAssets);

// Get single asset
router.get("/:id", getAssetById);

router.put(
  "/:id/destroy",
  authorizeRoles("admin", "system_admin", "head_of_it"),
  destroyAsset
);

// Any signed-in user can update an asset.
router.put("/:id", updateAsset);

// Any signed-in user can delete an asset.
router.delete("/:id", deleteAsset);

module.exports = router;
