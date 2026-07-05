const Repair = require("../models/Repair");
const Ticket = require("../models/Ticket");
const Asset = require("../models/Asset");

// Create repair record
const createRepair = async (req, res) => {
  try {
    const {
      ticketId,
      diagnosis,
      notes,
      replacedParts,
      repairStatus,
      completionDate,
    } = req.body;

    if (!ticketId || !diagnosis) {
      return res.status(400).json({
        message: "Ticket ID and diagnosis are required",
      });
    }

    const ticket = await Ticket.findOne({ ticketId }).populate("asset");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (!ticket.asset) {
      return res.status(400).json({
        message: "A linked asset is required before creating a repair record",
      });
    }

    const repairCount = await Repair.countDocuments();
    const repairId = `REP-${String(repairCount + 1).padStart(3, "0")}`;

    const repair = await Repair.create({
      repairId,
      ticket: ticket._id,
      asset: ticket.asset._id,
      technician: req.user._id,
      diagnosis,
      notes,
      replacedParts,
      repairStatus,
      completionDate,
    });

    await Ticket.findByIdAndUpdate(ticket._id, {
      status: repairStatus === "completed" ? "installed" : "under_review",
      remarks: notes || ticket.remarks,
    });

    if (repairStatus === "completed") {
      await Asset.findByIdAndUpdate(ticket.asset._id, {
        status: "active",
      });
    } else {
      await Asset.findByIdAndUpdate(ticket.asset._id, {
        status: "under_repair",
      });
    }

    const populatedRepair = await Repair.findById(repair._id)
      .populate("ticket")
      .populate("asset")
      .populate("technician", "name email role department");

    res.status(201).json({
      message: "Repair record created successfully",
      repair: populatedRepair,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all repair records
const getRepairs = async (req, res) => {
  try {
    const repairs = await Repair.find()
      .populate("ticket")
      .populate("asset")
      .populate("technician", "name email role department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: repairs.length,
      repairs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single repair record
const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate("ticket")
      .populate("asset")
      .populate("technician", "name email role department");

    if (!repair) {
      return res.status(404).json({
        message: "Repair record not found",
      });
    }

    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update repair record
const updateRepair = async (req, res) => {
  try {
    const repair = await Repair.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("ticket")
      .populate("asset")
      .populate("technician", "name email role department");

    if (!repair) {
      return res.status(404).json({
        message: "Repair record not found",
      });
    }

    res.status(200).json({
      message: "Repair record updated successfully",
      repair,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createRepair,
  getRepairs,
  getRepairById,
  updateRepair,
};
