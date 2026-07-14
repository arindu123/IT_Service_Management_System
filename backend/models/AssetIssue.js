const mongoose = require("mongoose");

// The issue table connects one registered item to one registered user.
const assetIssueSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    issueDate: { type: Date, required: true, default: Date.now },
    returnDate: { type: Date },
    status: { type: String, enum: ["issued", "returned"], default: "issued" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

assetIssueSchema.index({ item: 1, status: 1 });

module.exports = mongoose.model("AssetIssue", assetIssueSchema);
