const mongoose = require("mongoose");

const locationSnapshotSchema = new mongoose.Schema(
  {
    department: { type: String, default: "" },
    building: { type: String, default: "" },
    floor: { type: String, default: "" },
    room: { type: String, default: "" },
  },
  { _id: false }
);

const networkIncidentSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDevice",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["DEVICE_OFFLINE"],
      default: "DEVICE_OFFLINE",
    },
    severity: {
      type: String,
      enum: ["critical", "warning", "info"],
      default: "critical",
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    locationSnapshot: {
      type: locationSnapshotSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

networkIncidentSchema.index({ deviceId: 1, status: 1, openedAt: -1 });
networkIncidentSchema.index(
  { deviceId: 1, type: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "DEVICE_OFFLINE",
      status: "open",
    },
  }
);

module.exports = mongoose.model("NetworkIncident", networkIncidentSchema);
