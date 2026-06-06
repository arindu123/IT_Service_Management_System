const Asset = require("../models/Asset");

// Create new asset
const createAsset = async (req, res) => {
  try {
    const {
      assetId,
      serialNumber,
      deviceType,
      brand,
      model,
      location,
      department,
      warrantyDate,
      status,
      notes,
    } = req.body;

    if (
      !assetId ||
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
      $or: [{ assetId }, { serialNumber }],
    });

    if (assetExists) {
      return res.status(400).json({
        message: "Asset ID or Serial Number already exists",
      });
    }

    const asset = await Asset.create({
      assetId,
      serialNumber,
      deviceType,
      brand,
      model,
      location,
      department,
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
    const assets = await Asset.find().sort({ createdAt: -1 });

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