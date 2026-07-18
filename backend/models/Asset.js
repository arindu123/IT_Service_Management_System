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

const lifecycleEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["created", "updated", "issued", "returned", "transferred", "destroyed", "deleted"],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorSnapshot: { type: actorSnapshotSchema, default: () => ({}) },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    fromUserSnapshot: { type: userSnapshotSchema, default: () => ({}) },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    toUserSnapshot: { type: userSnapshotSchema, default: () => ({}) },
    issue: { type: mongoose.Schema.Types.ObjectId, ref: "AssetIssue", default: null },
    notes: { type: String, trim: true, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema(
  {
    itemNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Kept for existing ticket records that may still use the old asset ID.
    assetId: { type: String, trim: true, unique: true, sparse: true },

    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    deviceType: {
      type: String,
      required: true,
      enum: ["computer", "laptop", "printer", "scanner", "network_device", "other"],
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    productYear: { type: Number, min: 2010, max: 2100 },

    customDeviceType: { type: String, trim: true, default: "" },
    assetValue: { type: Number, min: 0, default: null },
    supplier: { type: String, trim: true, default: "" },
    invoiceImage: { type: String, default: "" },

    generation: { type: String, trim: true, default: "" },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    ministry: { type: String, trim: true, default: "" },

    userId: { type: String, trim: true, default: "" },

    userName: { type: String, trim: true, default: "" },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    assignedUserSnapshot: { type: userSnapshotSchema, default: () => ({}) },

    issueDate: { type: Date },

    warrantyDate: {
      type: Date,
    },
    hasWarranty: { type: Boolean, default: true },
    warrantyStartDate: { type: Date, default: null },
    warrantyEndDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["active", "issued", "under_repair", "damaged", "retired", "destroyed"],
      default: "active",
    },

    destroyedAt: { type: Date, default: null },

    destroyedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    lifecycleEvents: {
      type: [lifecycleEventSchema],
      default: [],
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

assetSchema.pre("validate", function normalizeLegacyAssetIdentifiers() {
  if (!this.itemNumber && this.assetId) {
    this.itemNumber = this.assetId;
  }

  if (!this.assetId && this.itemNumber) {
    this.assetId = this.itemNumber;
  }
});

module.exports = mongoose.model("Asset", assetSchema);
