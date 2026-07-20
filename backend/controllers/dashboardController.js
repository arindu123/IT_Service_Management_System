const User = require("../models/User");
const Asset = require("../models/Asset");
const Ticket = require("../models/Ticket");
const Repair = require("../models/Repair");
const Inventory = require("../models/Inventory");

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAssets = await Asset.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const totalRepairs = await Repair.countDocuments();
    const totalInventoryItems = await Inventory.countDocuments();

    const submittedTickets = await Ticket.countDocuments({ status: { $in: ["submitted", "open"] } });
    const acknowledgedTickets = await Ticket.countDocuments({ status: "acknowledged" });
    const underReviewTickets = await Ticket.countDocuments({ status: { $in: ["under_review", "assigned", "in_progress"] } });
    const procurementTickets = await Ticket.countDocuments({ status: { $in: ["procurement_required", "in_procurement"] } });
    const itemAvailableTickets = await Ticket.countDocuments({ status: "item_available" });
    const installationScheduledTickets = await Ticket.countDocuments({ status: "installation_scheduled" });
    const installedTickets = await Ticket.countDocuments({ status: { $in: ["installed", "resolved"] } });
    const closedTickets = await Ticket.countDocuments({ status: "closed" });

    const activeAssets = await Asset.countDocuments({ status: "active" });
    const issuedAssets = await Asset.countDocuments({ status: "issued" });
    const underRepairAssets = await Asset.countDocuments({ status: "under_repair" });
    const damagedAssets = await Asset.countDocuments({ status: "damaged" });
    const retiredAssets = await Asset.countDocuments({ status: "retired" });
    const destroyedAssets = await Asset.countDocuments({ status: "destroyed" });

    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    });

    res.status(200).json({
      users: {
        total: totalUsers,
      },
      assets: {
        total: totalAssets,
        active: activeAssets,
        issued: issuedAssets,
        underRepair: underRepairAssets,
        damaged: damagedAssets,
        retired: retiredAssets,
        destroyed: destroyedAssets,
      },
      tickets: {
        total: totalTickets,
        submitted: submittedTickets,
        acknowledged: acknowledgedTickets,
        underReview: underReviewTickets,
        procurement: procurementTickets,
        itemAvailable: itemAvailableTickets,
        installationScheduled: installationScheduledTickets,
        installed: installedTickets,
        closed: closedTickets,
        open: submittedTickets,
        assigned: underReviewTickets,
        inProgress: underReviewTickets,
        resolved: installedTickets,
      },
      repairs: {
        total: totalRepairs,
      },
      inventory: {
        totalItems: totalInventoryItems,
        lowStockCount: lowStockItems.length,
        lowStockItems,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getDashboardSummary,
};
