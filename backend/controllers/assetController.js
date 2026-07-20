const Asset = require("../models/Asset");
const AssetIssue = require("../models/AssetIssue");
const {
  actorSnapshot,
  appendAssetEvent,
  clearAssetAssignment,
  userSnapshot,
} = require("../utils/assetWorkflow");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function generateUniqueItemNumber() {
  const latest = await Asset.findOne({ itemNumber: /^IT\/ASSET\/\d{4}$/ }).sort({ itemNumber: -1 }).select("itemNumber").lean();
  const next = latest ? Number(latest.itemNumber.slice(-4)) + 1 : 1;
  return `IT/ASSET/${String(next).padStart(4, "0")}`;
}

// Create new asset
const createAsset = async (req, res) => {
  try {
    const {
      itemNumber,
      assetId,
      serialNumber,
      deviceType,
      brand,
      model,
      productYear,
      customDeviceType,
      assetValue,
      supplier,
      invoiceImage,
      generation,
      location,
      department,
      ministry,
      warrantyDate,
      hasWarranty,
      warrantyStartDate,
      warrantyEndDate,
      notes,
    } = req.body;

    const generatedItemNumber = itemNumber || assetId || await generateUniqueItemNumber();

    if (
      !serialNumber ||
      !deviceType ||
      (deviceType === "other" && !String(customDeviceType || "").trim()) ||
      !brand ||
      !model
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const itemIdentifier = generatedItemNumber;
    const duplicateChecks = [{ itemNumber: itemIdentifier }, { serialNumber }];
    if (assetId) duplicateChecks.push({ assetId });

    const assetExists = await Asset.findOne({
      $or: duplicateChecks,
    });

    if (assetExists) {
      return res.status(400).json({
        message: "Item Number, Asset ID or Serial Number already exists",
      });
    }

    const asset = await Asset.create({
      itemNumber: itemIdentifier,
      assetId: assetId || itemNumber,
      serialNumber,
      deviceType,
      brand,
      model,
      productYear,
      customDeviceType: deviceType === "other" ? customDeviceType : "",
      assetValue: assetValue === "" || assetValue === undefined ? null : assetValue,
      supplier,
      invoiceImage,
      generation,
      location,
      department,
      ministry,
      warrantyDate,
      hasWarranty: hasWarranty !== false,
      warrantyStartDate: hasWarranty === false ? null : warrantyStartDate || null,
      warrantyEndDate: hasWarranty === false ? null : warrantyEndDate || warrantyDate || null,
      status: "active",
      notes,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      lifecycleEvents: [
        {
          action: "created",
          actor: req.user._id,
          actorSnapshot: actorSnapshot(req.user),
          notes: "Asset registered",
        },
      ],
    });

    res.status(201).json({
      message: "Asset created successfully",
      asset,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get all assets
const getAssets = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const query = search
      ? {
          $or: [
            "itemNumber", "assetId", "serialNumber", "deviceType", "brand", "model",
            "userId", "userName", "department", "ministry", "location",
          ].map((field) => ({ [field]: { $regex: escapeRegex(search), $options: "i" } })),
        }
      : {};
    const assets = await Asset.find(query)
      .populate("assignedTo", "employeeId name department ministry designation")
      .populate("createdBy", "employeeId name role")
      .populate("updatedBy", "employeeId name role")
      .populate("destroyedBy", "employeeId name role")
      .populate("lifecycleEvents.actor", "employeeId name role")
      .populate("lifecycleEvents.fromUser", "employeeId name department ministry")
      .populate("lifecycleEvents.toUser", "employeeId name department ministry")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: assets.length,
      assets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get single asset
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate("assignedTo", "employeeId name department ministry designation")
      .populate("createdBy", "employeeId name role")
      .populate("updatedBy", "employeeId name role")
      .populate("lifecycleEvents.actor", "employeeId name role")
      .populate("lifecycleEvents.fromUser", "employeeId name department ministry")
      .populate("lifecycleEvents.toUser", "employeeId name department ministry");

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update asset
const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const protectedFields = new Set([
      "assignedTo",
      "assignedUserSnapshot",
      "userId",
      "userName",
      "issueDate",
      "createdBy",
      "updatedBy",
      "lifecycleEvents",
      "destroyedAt",
      "destroyedBy",
      "status",
    ]);

    Object.entries(req.body).forEach(([key, value]) => {
      if (!protectedFields.has(key)) {
        asset[key] = value;
      }
    });

    asset.updatedBy = req.user._id;
    appendAssetEvent(asset, {
      action: "updated",
      actor: req.user._id,
      actorSnapshot: actorSnapshot(req.user),
      notes: "Asset details updated",
    });

    await asset.save();

    res.status(200).json({
      message: "Asset updated successfully",
      asset,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const destroyAsset = async (req, res) => {
  try {
    const { reason } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    if (asset.status === "destroyed") {
      return res.status(400).json({
        message: "Asset is already destroyed",
      });
    }

    const activeIssue = await AssetIssue.findOne({ item: asset._id, status: "issued" }).populate(
      "user",
      "employeeId name department ministry designation"
    );
    const previousUserId = activeIssue?.user?._id || asset.assignedTo || null;
    const previousUserSnapshot = activeIssue?.user
      ? userSnapshot(activeIssue.user)
      : asset.assignedUserSnapshot || {};

    if (activeIssue) {
      activeIssue.status = "destroyed";
      activeIssue.destroyDate = new Date();
      activeIssue.destroyReason = reason || "";
      activeIssue.destroyedBy = req.user._id;
      activeIssue.destroyedBySnapshot = actorSnapshot(req.user);
      await activeIssue.save();
    }

    clearAssetAssignment(asset);
    asset.status = "destroyed";
    asset.destroyedAt = new Date();
    asset.destroyedBy = req.user._id;
    asset.updatedBy = req.user._id;
    appendAssetEvent(asset, {
      action: "destroyed",
      actor: req.user._id,
      actorSnapshot: actorSnapshot(req.user),
      fromUser: previousUserId,
      fromUserSnapshot: previousUserSnapshot,
      issue: activeIssue?._id || null,
      notes: reason || "Asset destroyed",
    });

    await asset.save();

    res.status(200).json({
      message: "Asset destroyed and removed from assigned user",
      asset,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Delete asset
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.status(200).json({
      message: "Asset deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  destroyAsset,
  deleteAsset,
};
