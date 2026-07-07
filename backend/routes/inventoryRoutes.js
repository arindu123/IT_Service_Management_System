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
const itInventoryRoles = ["admin", "system_admin", "head_of_it", "technician", "store_keeper"];

// All inventory routes are protected
router.use(protect);

// Create inventory item - IT inventory roles only
router.post("/", authorizeRoles(...itInventoryRoles), createInventoryItem);

// Get low stock items - IT inventory roles only
router.get("/low-stock", authorizeRoles(...itInventoryRoles), getLowStockItems);

// Get all inventory items - IT inventory roles only
router.get("/", authorizeRoles(...itInventoryRoles), getInventoryItems);

// Get single inventory item - IT inventory roles only
router.get("/:id", authorizeRoles(...itInventoryRoles), getInventoryItemById);

// Update inventory item - IT inventory roles only
router.put("/:id", authorizeRoles(...itInventoryRoles), updateInventoryItem);

// Delete inventory item - IT inventory roles only
router.delete("/:id", authorizeRoles(...itInventoryRoles), deleteInventoryItem);

module.exports = router;
