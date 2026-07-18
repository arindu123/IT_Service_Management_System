const mongoose = require("mongoose");

const passwordResetRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      enum: ["it_admin", "email"],
      default: "it_admin",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled", "expired"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    resetTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

passwordResetRequestSchema.index({ user: 1, status: 1 });
passwordResetRequestSchema.index({ employeeId: 1, status: 1 });
passwordResetRequestSchema.index({ resetTokenHash: 1 }, { sparse: true });

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
