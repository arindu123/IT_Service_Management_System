const mongoose = require("mongoose");

const networkMonitorLockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    owner: {
      type: String,
      required: true,
    },
    leaseUntil: {
      type: Date,
      required: true,
      index: true,
    },
    lastCycleAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NetworkMonitorLock", networkMonitorLockSchema);
