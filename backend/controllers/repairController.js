const Repair = require("../models/Repair");
const Ticket = require("../models/Ticket");
const Asset = require("../models/Asset");

const REPAIR_FIELDS = [
  "rrNumber",
  "type",
  "model",
  "serialNumber",
  "userName",
  "office",
  "receivedDate",
  "errorDescription",
  "servicePrinter",
  "serviceDate",
  "returnSituation",
  "returnDate",
  "specialNote",
  "notes",
  "replacedParts",
  "repairStatus",
  "completionDate",
];

const DATE_FIELDS = new Set(["receivedDate", "serviceDate", "returnDate", "completionDate"]);

function buildRepairPayload(body) {
  return REPAIR_FIELDS.reduce((payload, field) => {
    if (body[field] === undefined) return payload;

    payload[field] = DATE_FIELDS.has(field) && body[field] === "" ? null : body[field];
    return payload;
  }, {});
}

async function buildAutoRrNumber() {
  const year = new Date().getFullYear();
  const rrPattern = new RegExp(`^RR/${year}/\\d{3}$`);

  const existingRepairs = await Repair.find({ rrNumber: rrPattern }).select("rrNumber").lean();
  const highestSequence = existingRepairs.reduce((max, repair) => {
    const match = repair.rrNumber?.match(/^RR\/\d{4}\/(\d{3})$/);
    if (!match) return max;

    const sequence = Number.parseInt(match[1], 10);
    return Number.isFinite(sequence) && sequence > max ? sequence : max;
  }, 0);

  return `RR/${year}/${String(highestSequence + 1).padStart(3, "0")}`;
}

const getNextRepairRrNumber = async (req, res) => {
  try {
    const rrNumber = await buildAutoRrNumber();

    res.status(200).json({ rrNumber });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Create repair record
const createRepair = async (req, res) => {
  try {
    const repairCount = await Repair.countDocuments();
    const repairId = `REP-${String(repairCount + 1).padStart(3, "0")}`;
    const rrNumber = await buildAutoRrNumber();
    const repairPayload = buildRepairPayload(req.body);

    const repair = await Repair.create({
      ...repairPayload,
      repairId,
      rrNumber,
    });

    res.status(201).json({
      message: "Repair record created successfully",
      repair,
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
    const repair = await Repair.findByIdAndUpdate(req.params.id, buildRepairPayload(req.body), {
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

// Delete repair record
const deleteRepair = async (req, res) => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);

    if (!repair) {
      return res.status(404).json({
        message: "Repair record not found",
      });
    }

    res.status(200).json({
      message: "Repair record deleted successfully",
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
  deleteRepair,
  getNextRepairRrNumber,
};
