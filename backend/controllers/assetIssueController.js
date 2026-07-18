const Asset = require("../models/Asset");
const AssetIssue = require("../models/AssetIssue");
const User = require("../models/User");
const {
  actorSnapshot,
  appendAssetEvent,
  assignAssetToUser,
  clearAssetAssignment,
  userSnapshot,
} = require("../utils/assetWorkflow");

const populateIssue = (query) =>
  query
    .populate("user", "employeeId name department ministry designation")
    .populate("previousUser", "employeeId name department ministry designation")
    .populate("item", "itemNumber assetId brand model serialNumber status userId userName assignedTo")
    .populate("issuedBy", "employeeId name role")
    .populate("returnedBy", "employeeId name role")
    .populate("transferredBy", "employeeId name role")
    .populate("destroyedBy", "employeeId name role");

const parseOptionalDate = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const findActiveIssueForItem = (itemId) => AssetIssue.findOne({ item: itemId, status: "issued" });

const ensureAssignableAsset = (item, activeIssue) => {
  if (!item) {
    const error = new Error("Item not found");
    error.statusCode = 404;
    throw error;
  }

  if (activeIssue || item.status === "issued" || item.assignedTo) {
    const error = new Error("This item is already issued");
    error.statusCode = 400;
    throw error;
  }

  if (["destroyed", "retired", "damaged", "under_repair"].includes(item.status)) {
    const error = new Error("Destroyed, retired, damaged or under-repair assets cannot be issued");
    error.statusCode = 400;
    throw error;
  }
};

const sendError = (res, error) =>
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error",
    error: error.statusCode ? undefined : error.message,
  });

const issueItem = async (req, res) => {
  try {
    const { userId, itemId, issueDate, notes } = req.body;
    if (!userId || !itemId) return res.status(400).json({ message: "User ID and item ID are required" });

    const [user, item, activeIssue] = await Promise.all([
      User.findById(userId),
      Asset.findById(itemId),
      findActiveIssueForItem(itemId),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });
    ensureAssignableAsset(item, activeIssue);

    const issuedAt = parseOptionalDate(issueDate);
    const issue = await AssetIssue.create({
      user: user._id,
      userSnapshot: userSnapshot(user),
      item: item._id,
      issueDate: issuedAt,
      notes,
      issuedBy: req.user._id,
      issuedBySnapshot: actorSnapshot(req.user),
    });

    assignAssetToUser(item, user, issuedAt);
    item.updatedBy = req.user._id;
    appendAssetEvent(item, {
      action: "issued",
      actor: req.user._id,
      actorSnapshot: actorSnapshot(req.user),
      toUser: user._id,
      toUserSnapshot: userSnapshot(user),
      issue: issue._id,
      notes: notes || "Asset issued",
      at: issuedAt,
    });
    await item.save();

    const populatedIssue = await populateIssue(AssetIssue.findById(issue._id));
    res.status(201).json({ message: "Item issued successfully", issue: populatedIssue });
  } catch (error) {
    sendError(res, error);
  }
};

const getIssues = async (_req, res) => {
  try {
    const issues = await populateIssue(AssetIssue.find())
      .sort({ updatedAt: -1, issueDate: -1 });
    res.json({ count: issues.length, issues });
  } catch (error) {
    sendError(res, error);
  }
};

const returnItem = async (req, res) => {
  try {
    const issue = await populateIssue(AssetIssue.findById(req.params.id));

    if (!issue) return res.status(404).json({ message: "Issue record not found" });
    if (issue.status !== "issued") return res.status(400).json({ message: "Only currently issued items can be removed" });

    const itemId = issue.item?._id || issue.item;
    if (!itemId) return res.status(404).json({ message: "Asset not found" });

    const item = await Asset.findById(itemId);
    const previousUser = issue.user;

    if (!item) return res.status(404).json({ message: "Asset not found" });

    issue.status = "returned";
    issue.returnDate = new Date();
    issue.returnedBy = req.user._id;
    issue.returnedBySnapshot = actorSnapshot(req.user);
    await issue.save();

    clearAssetAssignment(item);
    item.status = "active";
    item.updatedBy = req.user._id;
    appendAssetEvent(item, {
      action: "returned",
      actor: req.user._id,
      actorSnapshot: actorSnapshot(req.user),
      fromUser: previousUser?._id || null,
      fromUserSnapshot: previousUser ? userSnapshot(previousUser) : {},
      issue: issue._id,
      notes: req.body.notes || "Asset removed from user",
    });
    await item.save();

    const populatedIssue = await populateIssue(AssetIssue.findById(issue._id));
    res.json({ message: "Item removed from user successfully", issue: populatedIssue });
  } catch (error) {
    sendError(res, error);
  }
};

const transferItem = async (req, res) => {
  try {
    const { newUserId, notes } = req.body;

    if (!newUserId) return res.status(400).json({ message: "New user is required" });

    const issue = await populateIssue(AssetIssue.findById(req.params.id));
    const newUser = await User.findById(newUserId);

    if (!issue) return res.status(404).json({ message: "Issue record not found" });
    if (!newUser) return res.status(404).json({ message: "New user not found" });
    if (issue.status !== "issued") return res.status(400).json({ message: "Only currently issued items can be transferred" });
    if (String(issue.user?._id) === String(newUser._id)) {
      return res.status(400).json({ message: "Asset is already issued to this user" });
    }

    const itemId = issue.item?._id || issue.item;
    if (!itemId) return res.status(404).json({ message: "Asset not found" });

    const item = await Asset.findById(itemId);
    const transferDate = new Date();
    const previousUser = issue.user;

    if (!item) return res.status(404).json({ message: "Asset not found" });

    issue.status = "transferred";
    issue.transferDate = transferDate;
    issue.transferNotes = notes || "";
    issue.transferredBy = req.user._id;
    issue.transferredBySnapshot = actorSnapshot(req.user);
    await issue.save();

    const newIssue = await AssetIssue.create({
      user: newUser._id,
      userSnapshot: userSnapshot(newUser),
      previousUser: previousUser?._id || null,
      previousUserSnapshot: previousUser ? userSnapshot(previousUser) : {},
      item: item._id,
      previousIssue: issue._id,
      issueDate: transferDate,
      notes: notes || `Transferred from ${previousUser?.name || "previous user"}`,
      issuedBy: req.user._id,
      issuedBySnapshot: actorSnapshot(req.user),
    });

    assignAssetToUser(item, newUser, transferDate);
    item.updatedBy = req.user._id;
    appendAssetEvent(item, {
      action: "transferred",
      actor: req.user._id,
      actorSnapshot: actorSnapshot(req.user),
      fromUser: previousUser?._id || null,
      fromUserSnapshot: previousUser ? userSnapshot(previousUser) : {},
      toUser: newUser._id,
      toUserSnapshot: userSnapshot(newUser),
      issue: newIssue._id,
      notes: notes || "Asset transferred",
      at: transferDate,
    });
    await item.save();

    const populatedIssue = await populateIssue(AssetIssue.findById(newIssue._id));
    res.json({ message: "Item transferred successfully", issue: populatedIssue });
  } catch (error) {
    sendError(res, error);
  }
};

const destroyIssuedItem = async (req, res) => {
  try {
    const { reason } = req.body;
    const issue = await populateIssue(AssetIssue.findById(req.params.id));

    if (!issue) return res.status(404).json({ message: "Issue record not found" });
    if (issue.status !== "issued") return res.status(400).json({ message: "Only currently issued items can be destroyed here" });

    const itemId = issue.item?._id || issue.item;
    if (!itemId) return res.status(404).json({ message: "Asset not found" });

    const item = await Asset.findById(itemId);
    const previousUser = issue.user;
    const destroyDate = new Date();

    if (!item) return res.status(404).json({ message: "Asset not found" });

    issue.status = "destroyed";
    issue.destroyDate = destroyDate;
    issue.destroyReason = reason || "";
    issue.destroyedBy = req.user._id;
    issue.destroyedBySnapshot = actorSnapshot(req.user);
    await issue.save();

    clearAssetAssignment(item);
    item.status = "destroyed";
    item.destroyedAt = destroyDate;
    item.destroyedBy = req.user._id;
    item.updatedBy = req.user._id;
    appendAssetEvent(item, {
      action: "destroyed",
      actor: req.user._id,
      actorSnapshot: actorSnapshot(req.user),
      fromUser: previousUser?._id || null,
      fromUserSnapshot: previousUser ? userSnapshot(previousUser) : {},
      issue: issue._id,
      notes: reason || "Asset destroyed",
      at: destroyDate,
    });
    await item.save();

    const populatedIssue = await populateIssue(AssetIssue.findById(issue._id));
    res.json({ message: "Item destroyed and removed from user", issue: populatedIssue });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = { destroyIssuedItem, getIssues, issueItem, returnItem, transferItem };
