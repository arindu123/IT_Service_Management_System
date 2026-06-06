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

    const openTickets = await Ticket.countDocuments({ status: "open" });
    const assignedTickets = await Ticket.countDocuments({ status: "assigned" });
    const inProgressTickets = await Ticket.countDocuments({ status: "in_progress" });
    const resolvedTickets = await Ticket.countDocuments({ status: "resolved" });
    const closedTickets = await Ticket.countDocuments({ status: "closed" });

    const activeAssets = await Asset.countDocuments({ status: "active" });
    const underRepairAssets = await Asset.countDocuments({ status: "under_repair" });
    const damagedAssets = await Asset.countDocuments({ status: "damaged" });
    const retiredAssets = await Asset.countDocuments({ status: "retired" });

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
        underRepair: underRepairAssets,
        damaged: damagedAssets,
        retired: retiredAssets,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        assigned: assignedTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
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
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
};