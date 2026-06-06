const Inventory = require("../models/Inventory");

// Create inventory item
const createInventoryItem = async (req, res) => {
  try {
    const {
      itemName,
      category,
      quantity,
      reorderLevel,
      unitPrice,
      supplierName,
      location,
      notes,
    } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({
        message: "Item name and category are required",
      });
    }

    const item = await Inventory.create({
      itemName,
      category,
      quantity,
      reorderLevel,
      unitPrice,
      supplierName,
      location,
      notes,
    });

    res.status(201).json({
      message: "Inventory item created successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all inventory items
const getInventoryItems = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single inventory item
const getInventoryItemById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Inventory item not found",
      });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({
        message: "Inventory item not found",
      });
    }

    res.status(200).json({
      message: "Inventory item updated successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Inventory item not found",
      });
    }

    res.status(200).json({
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    }).sort({ quantity: 1 });

    res.status(200).json({
      count: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
};