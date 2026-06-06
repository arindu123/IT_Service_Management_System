const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "computer_parts",
        "printer_parts",
        "network_parts",
        "cables",
        "accessories",
        "other",
      ],
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    reorderLevel: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },

    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    supplierName: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "IT Store",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);