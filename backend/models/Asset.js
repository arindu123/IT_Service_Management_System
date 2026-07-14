const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    itemNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Kept for existing ticket records that may still use the old asset ID.
    assetId: { type: String, trim: true, unique: true, sparse: true },

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

    productYear: { type: Number, min: 1900, max: 2100 },

    generation: { type: String, trim: true, default: "" },

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

    ministry: { type: String, trim: true, default: "" },

    userId: { type: String, trim: true, default: "" },

    userName: { type: String, trim: true, default: "" },

    issueDate: { type: Date },

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
