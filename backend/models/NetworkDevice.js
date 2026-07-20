const mongoose = require("mongoose");
const networkMonitorConfig = require("../config/networkMonitoring");

const networkDeviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hostname: {
      type: String,
      trim: true,
      default: "",
    },
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    deviceType: {
      type: String,
      required: true,
      enum: ["pc", "server", "printer", "router", "switch", "access_point", "cctv_nvr", "biometric", "other"],
      default: "pc",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    building: {
      type: String,
      trim: true,
      default: "",
    },
    floor: {
      type: String,
      trim: true,
      default: "",
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    monitoringEnabled: {
      type: Boolean,
      default: true,
    },
    checkMethod: {
      type: String,
      enum: ["icmp", "tcp", "http", "https"],
      default: "icmp",
    },
    tcpPort: {
      type: Number,
      min: 1,
      max: 65535,
      default: null,
    },
    checkIntervalSeconds: {
      type: Number,
      min: 30,
      max: 86400,
      default: networkMonitorConfig.defaultIntervalSeconds,
    },
    timeoutMs: {
      type: Number,
      min: 1000,
      max: 10000,
      default: networkMonitorConfig.timeoutMs,
    },
    failureThreshold: {
      type: Number,
      min: 1,
      max: 10,
      default: networkMonitorConfig.failureThreshold,
    },
    status: {
      type: String,
      enum: ["unknown", "online", "warning", "offline", "paused"],
      default: "unknown",
    },
    consecutiveFailures: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    lastStatusChangedAt: {
      type: Date,
      default: null,
    },
    responseTimeMs: {
      type: Number,
      min: 0,
      default: null,
    },
    lastErrorCode: {
      type: String,
      trim: true,
      default: "",
    },
    lastErrorMessage: {
      type: String,
      trim: true,
      default: "",
    },
    lastManualCheckAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

networkDeviceSchema.index({ status: 1 });
networkDeviceSchema.index({ monitoringEnabled: 1, lastCheckedAt: 1 });
networkDeviceSchema.index({ department: 1, building: 1, deviceType: 1 });

module.exports = mongoose.model("NetworkDevice", networkDeviceSchema);
