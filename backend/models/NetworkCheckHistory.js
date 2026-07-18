const mongoose = require("mongoose");
const networkMonitorConfig = require("../config/networkMonitoring");

const networkCheckHistorySchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDevice",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["online", "failed", "error"],
      required: true,
    },
    method: {
      type: String,
      enum: ["icmp", "tcp", "http", "https", "simulation"],
      required: true,
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
    errorCode: {
      type: String,
      trim: true,
      default: "",
    },
    errorMessage: {
      type: String,
      trim: true,
      default: "",
    },
    checkedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

networkCheckHistorySchema.index({ deviceId: 1, checkedAt: -1 });
networkCheckHistorySchema.index(
  { checkedAt: 1 },
  { expireAfterSeconds: networkMonitorConfig.historyRetentionDays * 24 * 60 * 60 }
);

module.exports = mongoose.model("NetworkCheckHistory", networkCheckHistorySchema);
