const mongoose = require("mongoose");

const actorSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false }
);

const userSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    department: { type: String, default: "" },
    ministry: { type: String, default: "" },
    designation: { type: String, default: "" },
  },
  { _id: false }
);

// The issue table connects one registered item to one registered user.
const assetIssueSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userSnapshot: { type: userSnapshotSchema, default: () => ({}) },
    previousUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    previousUserSnapshot: { type: userSnapshotSchema, default: () => ({}) },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    previousIssue: { type: mongoose.Schema.Types.ObjectId, ref: "AssetIssue", default: null },
    issueDate: { type: Date, required: true, default: Date.now },
    returnDate: { type: Date },
    transferDate: { type: Date },
    destroyDate: { type: Date },
    status: { type: String, enum: ["issued", "returned", "transferred", "destroyed"], default: "issued" },
    notes: { type: String, trim: true, default: "" },
    transferNotes: { type: String, trim: true, default: "" },
    destroyReason: { type: String, trim: true, default: "" },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    destroyedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    issuedBySnapshot: { type: actorSnapshotSchema, default: () => ({}) },
    returnedBySnapshot: { type: actorSnapshotSchema, default: () => ({}) },
    transferredBySnapshot: { type: actorSnapshotSchema, default: () => ({}) },
    destroyedBySnapshot: { type: actorSnapshotSchema, default: () => ({}) },
  },
  { timestamps: true }
);

assetIssueSchema.index({ item: 1, status: 1 });

module.exports = mongoose.model("AssetIssue", assetIssueSchema);
