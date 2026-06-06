const express = require("express");

const {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
} = require("../controllers/inventoryController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All inventory routes are protected
router.use(protect);

// Create inventory item - admin only
router.post("/", authorizeRoles("admin"), createInventoryItem);

// Get low stock items
router.get("/low-stock", getLowStockItems);

// Get all inventory items
router.get("/", getInventoryItems);

// Get single inventory item
router.get("/:id", getInventoryItemById);

// Update inventory item - admin only
router.put("/:id", authorizeRoles("admin"), updateInventoryItem);

// Delete inventory item - admin only
router.delete("/:id", authorizeRoles("admin"), deleteInventoryItem);

module.exports = router;