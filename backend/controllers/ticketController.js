const Ticket = require("../models/Ticket");
const Asset = require("../models/Asset");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const FULL_ACCESS_ROLES = ["admin", "system_admin", "head_of_it", "management"];
const FULFILLMENT_ROLES = [
  "admin",
  "system_admin",
  "head_of_it",
  "technician",
  "store_keeper",
  "procurement_officer",
];

const populateTicket = (query) =>
  query
    .populate("asset")
    .populate("createdBy", "name email employeeId role department designation phone officeLocation")
    .populate("assignedTechnician", "name email employeeId role department designation phone officeLocation")
    .populate("attachments.uploadedBy", "name email role")
    .populate("statusHistory.changedBy", "name email role");

const buildRequesterProfile = (user) => ({
  employeeId: user.employeeId || "",
  name: user.name || "",
  email: user.email || "",
  department: user.department || "",
  designation: user.designation || "",
  phone: user.phone || "",
  officeLocation: user.officeLocation || "",
});

const parseOptionalDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatLabel = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const normalizeTextValue = (value) => (value === undefined || value === null ? "" : String(value).trim());

const findAssetForRequester = async (assetId, user) => {
  const value = normalizeTextValue(assetId);
  if (!value) return null;

  const identityQuery = [{ assignedTo: user._id }];
  const employeeId = normalizeTextValue(user.employeeId);
  if (employeeId) {
    identityQuery.push({ userId: employeeId }, { "assignedUserSnapshot.employeeId": employeeId });
  }

  const assetIdentityQuery = mongoose.Types.ObjectId.isValid(value)
    ? { _id: value }
    : {
        $or: [
          { assetId: value },
          { itemNumber: value },
          { serialNumber: value },
        ],
      };

  return Asset.findOne({
    $and: [
      assetIdentityQuery,
      { $or: identityQuery },
    ],
  });
};

const getRequesterIdentityQuery = (user) => {
  const employeeId = normalizeTextValue(user.employeeId);

  if (!employeeId) {
    return { createdBy: user._id };
  }

  return {
    $or: [
      { createdBy: user._id },
      { "requesterProfile.employeeId": employeeId },
    ],
  };
};

const getTicketVisibilityQuery = (user) => {
  if (FULL_ACCESS_ROLES.includes(user.role)) {
    return {};
  }

  if (user.role === "department_user") {
    return getRequesterIdentityQuery(user);
  }

  if (user.role === "technician") {
    return {
      $or: [
        { assignedTechnician: user._id },
        { status: { $in: ["technician_assigned", "under_review", "installation_scheduled", "installed"] } },
      ],
    };
  }

  if (user.role === "store_keeper") {
    return {
      status: { $in: ["inventory_check", "item_available", "installation_scheduled"] },
    };
  }

  if (user.role === "procurement_officer") {
    return {
      status: { $in: ["procurement_required", "in_procurement", "item_available"] },
    };
  }

  return getRequesterIdentityQuery(user);
};

const canAccessTicket = (ticket, user) => {
  const employeeId = normalizeTextValue(user.employeeId);

  if (FULL_ACCESS_ROLES.includes(user.role)) return true;
  if (ticket.createdBy?._id?.equals?.(user._id) || ticket.createdBy?.equals?.(user._id)) return true;
  if (employeeId && normalizeTextValue(ticket.requesterProfile?.employeeId) === employeeId) return true;
  if (ticket.assignedTechnician?._id?.equals?.(user._id) || ticket.assignedTechnician?.equals?.(user._id)) return true;
  if (user.role === "store_keeper") return ["inventory_check", "item_available", "installation_scheduled"].includes(ticket.status);
  if (user.role === "procurement_officer") return ["procurement_required", "in_procurement", "item_available"].includes(ticket.status);
  return false;
};

const addStatusHistory = (ticket, newStatus, oldStatus, comment, userId, changeSummary = []) => {
  ticket.statusHistory.push({
    oldStatus,
    newStatus,
    comment,
    changedBy: userId,
    changeSummary,
  });
};

// Create new ticket
const createTicket = async (req, res) => {
  try {
    const {
      assetId,
      requestType,
      hardwareCategory,
      currentAssetTag,
      issueDescription,
      businessImpact,
      requestedSpecification,
      priority,
      department,
      preferredInstallationTime,
      remarks,
    } = req.body;

    if (!issueDescription || !requestType || !hardwareCategory) {
      return res.status(400).json({
        message: "Request type, hardware category and issue description are required",
      });
    }

    let asset = null;

    if (assetId) {
      asset = await findAssetForRequester(assetId, req.user);

      if (!asset) {
        return res.status(404).json({
          message: "Assigned asset not found",
        });
      }
    }

    const ticketCount = await Ticket.countDocuments();
    const ticketId = `TCK-${String(ticketCount + 1).padStart(3, "0")}`;
    const requesterProfile = buildRequesterProfile(req.user);
    const requestDepartment = requesterProfile.department || department || "Unassigned";

    const ticket = await Ticket.create({
      ticketId,
      asset: asset?._id || null,
      requestType,
      hardwareCategory,
      currentAssetTag: currentAssetTag || assetId || "",
      issueDescription,
      businessImpact,
      requestedSpecification,
      priority,
      department: requestDepartment,
      preferredInstallationTime: parseOptionalDate(preferredInstallationTime),
      remarks,
      createdBy: req.user._id,
      requesterProfile,
      status: "submitted",
      nextAction: "Awaiting Head of IT acknowledgement",
      requesterLastViewedAt: new Date(),
      statusHistory: [
        {
          oldStatus: "",
          newStatus: "submitted",
          comment: "Request submitted by employee",
          changeSummary: ["Request submitted by employee"],
          changedBy: req.user._id,
        },
      ],
    });

    const populatedTicket = await populateTicket(Ticket.findById(ticket._id));

    res.status(201).json({
      message: "Hardware request submitted successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get all tickets
const getTickets = async (req, res) => {
  try {
    const tickets = await populateTicket(Ticket.find(getTicketVisibilityQuery(req.user)))
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get requests submitted by the signed-in user
const getMyTickets = async (req, res) => {
  try {
    const tickets = await populateTicket(Ticket.find(getRequesterIdentityQuery(req.user))).sort({ updatedAt: -1 });

    res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const markMyTicketUpdatesRead = async (req, res) => {
  try {
    const viewedAt = new Date();

    await Ticket.updateMany(
      getRequesterIdentityQuery(req.user),
      {
        $set: {
          requesterLastViewedAt: viewedAt,
        },
      }
    );

    const tickets = await populateTicket(Ticket.find(getRequesterIdentityQuery(req.user))).sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Request notifications marked as read",
      viewedAt,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get single ticket
const getTicketById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket = await populateTicket(Ticket.findById(req.params.id));

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        message: "Access denied for this request",
      });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
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

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const oldStatus = ticket.status;
    ticket.assignedTechnician = technicianId;
    ticket.status = "technician_assigned";
    ticket.nextAction = "Technician to assess the hardware request";
    const assignmentSummary = [
      `Technician assigned: ${technician.name}`,
      "Next action updated",
    ];

    if (oldStatus !== ticket.status) {
      assignmentSummary.unshift(`Status changed from ${formatLabel(oldStatus)} to ${formatLabel(ticket.status)}`);
    }

    addStatusHistory(
      ticket,
      ticket.status,
      oldStatus,
      `Technician assigned: ${technician.name}`,
      req.user._id,
      assignmentSummary
    );

    await ticket.save();
    await ticket.populate([
      { path: "asset" },
      { path: "createdBy", select: "name email employeeId role department designation phone officeLocation" },
      { path: "assignedTechnician", select: "name email employeeId role department designation phone officeLocation" },
      { path: "statusHistory.changedBy", select: "name email role" },
      { path: "attachments.uploadedBy", select: "name email role" },
    ]);

    res.status(200).json({
      message: "Technician assigned successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update ticket status
const updateTicketStatus = async (req, res) => {
  try {
    const {
      status,
      remarks,
      nextAction,
      expectedFulfillmentDate,
      technicalDiagnosis,
      recommendedAction,
      requiredItem,
      procurementStatus,
      procurementReference,
      supplier,
      itemAvailability,
      installationSchedule,
      comment,
    } = req.body;

    if (!FULFILLMENT_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied for this role",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const oldStatus = ticket.status;
    const changeSummary = [];

    if (status && status !== oldStatus) {
      ticket.status = status;
      changeSummary.push(`Status changed from ${formatLabel(oldStatus)} to ${formatLabel(status)}`);
    }

    const updateTextField = (fieldName, label, value) => {
      if (value === undefined) return;

      const oldValue = normalizeTextValue(ticket[fieldName]);
      const newValue = normalizeTextValue(value);

      if (oldValue !== newValue) {
        ticket[fieldName] = value;
        changeSummary.push(`${label} updated`);
      }
    };

    const updateDateField = (fieldName, label, value) => {
      if (value === undefined) return;

      const parsedValue = parseOptionalDate(value);
      const oldValue = normalizeDateValue(ticket[fieldName]);
      const newValue = normalizeDateValue(parsedValue);

      if (oldValue !== newValue) {
        ticket[fieldName] = parsedValue;
        changeSummary.push(`${label} updated`);
      }
    };

    updateTextField("remarks", "Remarks", remarks);
    updateTextField("nextAction", "Next action", nextAction);
    updateDateField("expectedFulfillmentDate", "Expected fulfillment date", expectedFulfillmentDate);
    updateTextField("technicalDiagnosis", "Technical diagnosis", technicalDiagnosis);
    updateTextField("recommendedAction", "Recommended action", recommendedAction);
    updateTextField("requiredItem", "Required item", requiredItem);
    updateTextField("procurementStatus", "Procurement status", procurementStatus);
    updateTextField("procurementReference", "Procurement reference", procurementReference);
    updateTextField("supplier", "Supplier", supplier);
    updateTextField("itemAvailability", "Item availability", itemAvailability);
    updateDateField("installationSchedule", "Installation schedule", installationSchedule);

    if (changeSummary.length === 0 && normalizeTextValue(comment)) {
      changeSummary.push("Timeline comment added");
    }

    if (changeSummary.length > 0) {
      addStatusHistory(
        ticket,
        ticket.status,
        oldStatus,
        comment || remarks || changeSummary.join("; "),
        req.user._id,
        changeSummary
      );
    }

    await ticket.save();
    await ticket.populate([
      { path: "asset" },
      { path: "createdBy", select: "name email employeeId role department designation phone officeLocation" },
      { path: "assignedTechnician", select: "name email employeeId role department designation phone officeLocation" },
      { path: "statusHistory.changedBy", select: "name email role" },
      { path: "attachments.uploadedBy", select: "name email role" },
    ]);

    res.status(200).json({
      message: "Request updated successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const acknowledgeTicket = async (req, res) => {
  req.body.status = "acknowledged";
  req.body.nextAction = req.body.nextAction || "Accepted for processing by Head of IT";
  req.body.comment = req.body.comment || "Request acknowledged and accepted for processing";
  return updateTicketStatus(req, res);
};

const rejectTicket = async (req, res) => {
  if (!req.body.comment && !req.body.remarks) {
    return res.status(400).json({
      message: "A rejection reason is required",
    });
  }

  req.body.status = "rejected";
  req.body.nextAction = "Request closed after rejection";
  return updateTicketStatus(req, res);
};

const requestMoreInfo = async (req, res) => {
  req.body.status = "need_more_information";
  req.body.nextAction = req.body.nextAction || "Requester must provide additional information";
  req.body.comment = req.body.comment || req.body.remarks || "Additional information requested";
  return updateTicketStatus(req, res);
};

const uploadTicketAttachments = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        message: "Access denied for this request",
      });
    }

    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        message: "At least one evidence file is required",
      });
    }

    const existingSize = ticket.attachments.reduce((total, file) => total + file.size, 0);
    const uploadSize = files.reduce((total, file) => total + file.size, 0);
    const maxRequestSize = 50 * 1024 * 1024;

    if (existingSize + uploadSize > maxRequestSize) {
      return res.status(400).json({
        message: "Total evidence size cannot exceed 50 MB per request",
      });
    }

    ticket.attachments.push(
      ...files.map((file) => ({
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path.replace(/\\/g, "/"),
        scanStatus: "not_configured",
        uploadedBy: req.user._id,
      }))
    );

    addStatusHistory(
      ticket,
      ticket.status,
      ticket.status,
      `${files.length} evidence file(s) uploaded`,
      req.user._id,
      [`${files.length} evidence file(s) uploaded`]
    );

    await ticket.save();
    await ticket.populate([
      { path: "asset" },
      { path: "createdBy", select: "name email employeeId role department designation phone officeLocation" },
      { path: "assignedTechnician", select: "name email employeeId role department designation phone officeLocation" },
      { path: "statusHistory.changedBy", select: "name email role" },
      { path: "attachments.uploadedBy", select: "name email role" },
    ]);

    res.status(200).json({
      message: "Evidence uploaded successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const downloadEvidence = async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId) || !mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({
        message: "Invalid ticket or attachment ID",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        message: "Access denied for this request",
      });
    }

    const attachment = ticket.attachments.id(attachmentId);

    if (!attachment) {
      return res.status(404).json({
        message: "Attachment not found",
      });
    }

    const filePath = path.isAbsolute(attachment.path)
      ? attachment.path
      : path.join(__dirname, "..", attachment.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found on server",
      });
    }

    res.download(filePath, attachment.originalName);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteEvidence = async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId) || !mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({
        message: "Invalid ticket or attachment ID",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        message: "Access denied for this request",
      });
    }

    const attachment = ticket.attachments.id(attachmentId);

    if (!attachment) {
      return res.status(404).json({
        message: "Attachment not found",
      });
    }

    // Check if user is authorized to delete (uploaded by them or they are admin/system_admin)
    const isUploader = attachment.uploadedBy.equals(req.user._id);
    const isAdmin = ["admin", "system_admin"].includes(req.user.role);

    if (!isUploader && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to delete this attachment",
      });
    }

    const filePath = path.isAbsolute(attachment.path)
      ? attachment.path
      : path.join(__dirname, "..", attachment.path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    attachment.deleteOne();

    addStatusHistory(
      ticket,
      ticket.status,
      ticket.status,
      `Evidence file deleted: ${attachment.originalName}`,
      req.user._id,
      [`Evidence file deleted: ${attachment.originalName}`]
    );

    await ticket.save();
    await ticket.populate([
      { path: "asset" },
      { path: "createdBy", select: "name email employeeId role department designation phone officeLocation" },
      { path: "assignedTechnician", select: "name email employeeId role department designation phone officeLocation" },
      { path: "statusHistory.changedBy", select: "name email role" },
      { path: "attachments.uploadedBy", select: "name email role" },
    ]);

    res.status(200).json({
      message: "Evidence file deleted successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update ticket by creator (only for draft and submitted tickets)
const updateTicket = async (req, res) => {
  try {
    const {
      requestType,
      hardwareCategory,
      currentAssetTag,
      issueDescription,
      businessImpact,
      requestedSpecification,
      priority,
      preferredInstallationTime,
      remarks,
    } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    // Only allow creator to edit draft and submitted tickets
    if (!ticket.createdBy?.equals?.(req.user._id) && !ticket.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        message: "Only the ticket creator can update this ticket",
      });
    }

    if (!["draft", "submitted"].includes(ticket.status)) {
      return res.status(400).json({
        message: "Tickets can only be updated when in draft or submitted status",
      });
    }

    // Update only provided fields
    if (requestType) ticket.requestType = requestType;
    if (hardwareCategory) ticket.hardwareCategory = hardwareCategory;
    if (currentAssetTag) ticket.currentAssetTag = currentAssetTag;
    if (issueDescription) ticket.issueDescription = issueDescription;
    if (businessImpact !== undefined) ticket.businessImpact = businessImpact;
    if (requestedSpecification !== undefined) ticket.requestedSpecification = requestedSpecification;
    if (priority) ticket.priority = priority;
    if (preferredInstallationTime) ticket.preferredInstallationTime = parseOptionalDate(preferredInstallationTime);
    if (remarks !== undefined) ticket.remarks = remarks;

    await ticket.save();
    await ticket.populate([
      { path: "asset" },
      { path: "createdBy", select: "name email employeeId role department designation phone officeLocation" },
      { path: "assignedTechnician", select: "name email employeeId role department designation phone officeLocation" },
      { path: "statusHistory.changedBy", select: "name email role" },
      { path: "attachments.uploadedBy", select: "name email role" },
    ]);

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Delete ticket by creator (only for draft and submitted tickets)
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    // Only allow creator to delete draft and submitted tickets
    if (!ticket.createdBy?.equals?.(req.user._id) && !ticket.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        message: "Only the ticket creator can delete this ticket",
      });
    }

    if (!["draft", "submitted"].includes(ticket.status)) {
      return res.status(400).json({
        message: "Tickets can only be deleted when in draft or submitted status",
      });
    }

    // Delete all attached files
    ticket.attachments.forEach((attachment) => {
      const filePath = path.isAbsolute(attachment.path)
        ? attachment.path
        : path.join(__dirname, "..", attachment.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Ticket.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getMyTickets,
  markMyTicketUpdatesRead,
  getTicketById,
  assignTechnician,
  updateTicketStatus,
  acknowledgeTicket,
  rejectTicket,
  requestMoreInfo,
  uploadTicketAttachments,
  downloadEvidence,
  deleteEvidence,
  updateTicket,
  deleteTicket,
};

