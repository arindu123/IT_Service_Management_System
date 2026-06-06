const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    deviceType: {
      type: String,
      required: true,
      enum: ["computer", "laptop", "printer", "scanner", "network_device", "other"],
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    warrantyDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "under_repair", "damaged", "retired"],
      default: "active",
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

module.exports = mongoose.model("Asset", assetSchema);