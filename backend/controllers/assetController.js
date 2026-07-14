const Asset = require("../models/Asset");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
      generation,
      location,
      department,
      ministry,
      userId,
      userName,
      issueDate,
      warrantyDate,
      status,
      notes,
    } = req.body;

    if (
      !(itemNumber || assetId) ||
      !serialNumber ||
      !deviceType ||
      !brand ||
      !model ||
      !location ||
      !department
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const assetExists = await Asset.findOne({
      $or: [{ itemNumber: itemNumber || assetId }, { serialNumber }],
    });

    if (assetExists) {
      return res.status(400).json({
        message: "Asset ID or Serial Number already exists",
      });
    }

    const asset = await Asset.create({
      itemNumber: itemNumber || assetId,
      assetId: assetId || itemNumber,
      serialNumber,
      deviceType,
      brand,
      model,
      productYear,
      generation,
      location,
      department,
      ministry,
      userId,
      userName,
      issueDate,
      warrantyDate,
      status,
      notes,
    });

    res.status(201).json({
      message: "Asset created successfully",
      asset,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
    const assets = await Asset.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      count: assets.length,
      assets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single asset
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update asset
const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.status(200).json({
      message: "Asset updated successfully",
      asset,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
      error: error.message,
    });
  }
};

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
};
