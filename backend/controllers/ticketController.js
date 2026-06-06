const Ticket = require("../models/Ticket");
const Asset = require("../models/Asset");
const User = require("../models/User");

// Create new ticket
const createTicket = async (req, res) => {
  try {
    const { assetId, issueDescription, priority, department, remarks } = req.body;

    if (!assetId || !issueDescription || !department) {
      return res.status(400).json({
        message: "Asset ID, issue description and department are required",
      });
    }

    const asset = await Asset.findOne({ assetId });

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const ticketCount = await Ticket.countDocuments();
    const ticketId = `TCK-${String(ticketCount + 1).padStart(3, "0")}`;

    const ticket = await Ticket.create({
      ticketId,
      asset: asset._id,
      issueDescription,
      priority,
      department,
      remarks,
      createdBy: req.user._id,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("asset")
      .populate("createdBy", "name email role department");

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all tickets
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("asset")
      .populate("createdBy", "name email role department")
      .populate("assignedTechnician", "name email role department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single ticket
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("asset")
      .populate("createdBy", "name email role department")
      .populate("assignedTechnician", "name email role department");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Assign technician
const assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        message: "Technician ID is required",
      });
    }

    const technician = await User.findById(technicianId);

    if (!technician || technician.role !== "technician") {
      return res.status(404).json({
        message: "Technician not found",
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        assignedTechnician: technicianId,
        status: "assigned",
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("asset")
      .populate("createdBy", "name email role department")
      .populate("assignedTechnician", "name email role department");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      message: "Technician assigned successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update ticket status
const updateTicketStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        status,
        remarks,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("asset")
      .populate("createdBy", "name email role department")
      .populate("assignedTechnician", "name email role department");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  assignTechnician,
  updateTicketStatus,
};