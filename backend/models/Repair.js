const mongoose = require("mongoose");

const repairSchema = new mongoose.Schema(
  {
    repairId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
    },

    replacedParts: [
      {
        itemName: String,
        quantity: Number,
      },
    ],

    repairStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
    },

    completionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Repair", repairSchema);