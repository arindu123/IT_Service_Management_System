const Asset = require("../models/Asset");
const AssetIssue = require("../models/AssetIssue");
const User = require("../models/User");

const issueItem = async (req, res) => {
  try {
    const { userId, itemId, issueDate, notes } = req.body;
    if (!userId || !itemId) return res.status(400).json({ message: "User ID and item ID are required" });

    const [user, item, activeIssue] = await Promise.all([
      User.findById(userId),
      Asset.findById(itemId),
      AssetIssue.findOne({ item: itemId, status: "issued" }),
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (activeIssue) return res.status(400).json({ message: "This item is already issued" });

    const issue = await AssetIssue.create({ user: userId, item: itemId, issueDate, notes });
    await Asset.findByIdAndUpdate(itemId, { status: "active" });
    const populatedIssue = await AssetIssue.findById(issue._id)
      .populate("user", "employeeId name department ministry")
      .populate("item", "itemNumber brand model serialNumber");
    res.status(201).json({ message: "Item issued successfully", issue: populatedIssue });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getIssues = async (_req, res) => {
  try {
    const issues = await AssetIssue.find()
      .populate("user", "employeeId name department ministry")
      .populate("item", "itemNumber brand model serialNumber")
      .sort({ issueDate: -1 });
    res.json({ count: issues.length, issues });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const returnItem = async (req, res) => {
  try {
    const issue = await AssetIssue.findByIdAndUpdate(
      req.params.id,
      { status: "returned", returnDate: new Date() },
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: "Issue record not found" });
    res.json({ message: "Item returned successfully", issue });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { issueItem, getIssues, returnItem };
