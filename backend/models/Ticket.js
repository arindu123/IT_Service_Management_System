const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    issueDescription: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "resolved", "closed"],
      default: "open",
    },

    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);