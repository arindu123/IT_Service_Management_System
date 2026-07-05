const mongoose = require("mongoose");

const statusValues = [
  "draft",
  "submitted",
  "acknowledged",
  "need_more_information",
  "under_review",
  "technician_assigned",
  "inventory_check",
  "procurement_required",
  "in_procurement",
  "item_available",
  "installation_scheduled",
  "installed",
  "closed",
  "rejected",
  "cancelled",
  "open",
  "assigned",
  "in_progress",
  "resolved",
];

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
      default: null,
    },

    requestType: {
      type: String,
      enum: ["fault", "replacement", "upgrade", "performance_issue", "procurement", "other"],
      default: "fault",
    },

    hardwareCategory: {
      type: String,
      enum: [
        "mouse",
        "keyboard",
        "monitor",
        "ram",
        "storage",
        "cpu",
        "printer",
        "laptop_desktop",
        "network_device",
        "scanner",
        "accessories",
        "other",
      ],
      default: "other",
    },

    currentAssetTag: {
      type: String,
      default: "",
      trim: true,
    },

    issueDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },

    businessImpact: {
      type: String,
      default: "",
      trim: true,
    },

    requestedSpecification: {
      type: String,
      default: "",
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      enum: statusValues,
      default: "submitted",
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

    requesterProfile: {
      employeeId: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      department: { type: String, default: "" },
      designation: { type: String, default: "" },
      phone: { type: String, default: "" },
      officeLocation: { type: String, default: "" },
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    preferredInstallationTime: {
      type: Date,
      default: null,
    },

    expectedFulfillmentDate: {
      type: Date,
      default: null,
    },

    nextAction: {
      type: String,
      default: "",
      trim: true,
    },

    technicalDiagnosis: {
      type: String,
      default: "",
      trim: true,
    },

    recommendedAction: {
      type: String,
      enum: ["", "repair", "replacement", "upgrade", "procurement", "no_action"],
      default: "",
    },

    requiredItem: {
      type: String,
      default: "",
      trim: true,
    },

    procurementStatus: {
      type: String,
      enum: ["", "not_required", "requested", "approved", "ordered", "received", "delayed", "cancelled"],
      default: "",
    },

    procurementReference: {
      type: String,
      default: "",
      trim: true,
    },

    supplier: {
      type: String,
      default: "",
      trim: true,
    },

    itemAvailability: {
      type: String,
      enum: ["", "stock_check_pending", "available_in_stock", "reserved", "procurement_required", "received"],
      default: "",
    },

    installationSchedule: {
      type: Date,
      default: null,
    },

    attachments: [
      {
        originalName: { type: String, required: true },
        storedName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        path: { type: String, required: true },
        scanStatus: {
          type: String,
          enum: ["pending", "not_configured", "clean", "blocked"],
          default: "not_configured",
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    statusHistory: [
      {
        oldStatus: { type: String, default: "" },
        newStatus: { type: String, required: true },
        comment: { type: String, default: "" },
        changeSummary: [{ type: String, trim: true }],
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    requesterLastViewedAt: {
      type: Date,
      default: null,
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
