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
      required: false,
    },

    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: false,
    },

    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    diagnosis: {
      type: String,
      required: false,
      trim: true,
    },

    // New Fields
    rrNumber: { type: String },
    type: { type: String },
    model: { type: String },
    serialNumber: { type: String },
    userName: { type: String },
    office: { type: String },
    receivedDate: { type: Date },
    errorDescription: { type: String },
    servicePrinter: { type: String },
    serviceDate: { type: Date },
    returnSituation: { type: String },
    returnDate: { type: Date },
    specialNote: { type: String },

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