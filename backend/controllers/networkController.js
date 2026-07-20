const mongoose = require("mongoose");
const NetworkCheckHistory = require("../models/NetworkCheckHistory");
const NetworkDevice = require("../models/NetworkDevice");
const NetworkIncident = require("../models/NetworkIncident");
const networkMonitorConfig = require("../config/networkMonitoring");
const { getSchedulerSnapshot } = require("../services/networkMonitorScheduler");
const { getHistoryWithUptime, runDeviceCheck } = require("../services/networkMonitorService");
const {
  DEVICE_STATUSES,
  escapeRegex,
  normalizeNetworkDevicePayload,
  normalizePagination,
} = require("../utils/networkValidation");

const buildDeviceQuery = (queryParams) => {
  const query = {};
  const search = String(queryParams.search || "").trim();

  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [
      { name: regex },
      { hostname: regex },
      { ipAddress: regex },
      { department: regex },
      { building: regex },
      { floor: regex },
      { room: regex },
      { description: regex },
    ];
  }

  ["status", "department", "building", "deviceType", "checkMethod"].forEach((field) => {
    if (queryParams[field]) {
      query[field] = String(queryParams[field]).trim();
    }
  });

  if (query.status && !DEVICE_STATUSES.has(query.status)) {
    delete query.status;
  }

  return query;
};

const validateObjectId = (id, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
};

const sendControllerError = (res, error) => {
  if (error.code === 11000) {
    return res.status(400).json({
      message: "A monitored device with this IP address already exists",
    });
  }

  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Unable to process request",
  });
};

const listDevices = async (req, res) => {
  try {
    const pagination = normalizePagination(req.query);
    const query = buildDeviceQuery(req.query);
    const sortField = ["name", "status", "lastCheckedAt", "responseTimeMs", "createdAt"].includes(req.query.sort)
      ? req.query.sort
      : "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const [devices, total] = await Promise.all([
      NetworkDevice.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit),
      NetworkDevice.countDocuments(query),
    ]);

    res.status(200).json({
      count: devices.length,
      total,
      page: pagination.page,
      pages: Math.ceil(total / pagination.limit) || 1,
      devices,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const createDevice = async (req, res) => {
  try {
    const payload = normalizeNetworkDevicePayload(req.body);
    const device = await NetworkDevice.create({
      ...payload,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    console.log(`Network device created by ${req.user.email}: ${device.name} ${device.ipAddress}`);

    res.status(201).json({
      message: "Network device created successfully",
      device,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const getDeviceById = async (req, res) => {
  try {
    validateObjectId(req.params.id, "device ID");

    const device = await NetworkDevice.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Network device not found",
      });
    }

    const openIncident = await NetworkIncident.findOne({
      deviceId: device._id,
      type: "DEVICE_OFFLINE",
      status: "open",
    });

    res.status(200).json({
      device,
      openIncident,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const updateDevice = async (req, res) => {
  try {
    validateObjectId(req.params.id, "device ID");

    const device = await NetworkDevice.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Network device not found",
      });
    }

    const payload = normalizeNetworkDevicePayload(req.body, device);
    Object.assign(device, payload, { updatedBy: req.user._id });
    await device.save();

    console.log(`Network device updated by ${req.user.email}: ${device.name} ${device.ipAddress}`);

    res.status(200).json({
      message: "Network device updated successfully",
      device,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const deleteDevice = async (req, res) => {
  try {
    validateObjectId(req.params.id, "device ID");

    const device = await NetworkDevice.findByIdAndDelete(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Network device not found",
      });
    }

    await Promise.all([
      NetworkCheckHistory.deleteMany({ deviceId: device._id }),
      NetworkIncident.deleteMany({ deviceId: device._id }),
    ]);

    console.log(`Network device deleted by ${req.user.email}: ${device.name} ${device.ipAddress}`);

    res.status(200).json({
      message: "Network device deleted successfully",
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const manualCheckDevice = async (req, res) => {
  try {
    validateObjectId(req.params.id, "device ID");

    const device = await NetworkDevice.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Network device not found",
      });
    }

    if (
      device.lastManualCheckAt &&
      Date.now() - new Date(device.lastManualCheckAt).getTime() < networkMonitorConfig.manualCheckCooldownMs
    ) {
      return res.status(429).json({
        message: "Please wait a few seconds before running another manual check for this device",
      });
    }

    device.lastManualCheckAt = new Date();
    await device.save();

    const result = await runDeviceCheck(device, { manual: true });

    console.log(`Manual network check by ${req.user.email}: ${device.name} ${device.ipAddress}`);

    res.status(200).json({
      message: result.check?.status === "online" ? "Device is reachable" : "Device check completed",
      ...result,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const pauseDevice = async (req, res) => {
  try {
    validateObjectId(req.params.id, "device ID");

    const device = await NetworkDevice.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Network device not found",
      });
    }

    device.monitoringEnabled = false;
    device.status = "paused";
    device.updatedBy = req.user._id;
    device.lastStatusChangedAt = new Date();
    await device.save();

    console.log(`Network monitoring paused by ${req.user.email}: ${device.name} ${device.ipAddress}`);

    res.status(200).json({
      message: "Monitoring paused successfully",
      device,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const resumeDevice = async (req, res) => {
  try {
    validateObjectId(req.params.id, "device ID");

    const device = await NetworkDevice.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Network device not found",
      });
    }

    device.monitoringEnabled = true;
    device.status = "unknown";
    device.consecutiveFailures = 0;
    device.updatedBy = req.user._id;
    device.lastStatusChangedAt = new Date();
    await device.save();

    console.log(`Network monitoring resumed by ${req.user.email}: ${device.name} ${device.ipAddress}`);

    res.status(200).json({
      message: "Monitoring resumed successfully",
      device,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const getSummary = async (req, res) => {
  try {
    const [statusCounts, openIncidentCount, totalDevices] = await Promise.all([
      NetworkDevice.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      NetworkIncident.countDocuments({ status: "open" }),
      NetworkDevice.countDocuments(),
    ]);

    const byStatus = statusCounts.reduce(
      (accumulator, item) => ({
        ...accumulator,
        [item._id || "unknown"]: item.count,
      }),
      {
        unknown: 0,
        online: 0,
        warning: 0,
        offline: 0,
        paused: 0,
      }
    );

    res.status(200).json({
      total: totalDevices,
      byStatus,
      openIncidentCount,
      scheduler: getSchedulerSnapshot(),
      config: {
        enabled: networkMonitorConfig.enabled,
        simulationMode: networkMonitorConfig.simulationMode,
        defaultIntervalSeconds: networkMonitorConfig.defaultIntervalSeconds,
        maxConcurrency: networkMonitorConfig.maxConcurrency,
        historyRetentionDays: networkMonitorConfig.historyRetentionDays,
      },
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

const getDeviceHistory = async (req, res) => {
  try {
    validateObjectId(req.params.id, "device ID");

    const pagination = normalizePagination(req.query);
    const range = ["24h", "7d", "30d"].includes(req.query.range) ? req.query.range : "24h";
    const result = await getHistoryWithUptime({
      deviceId: req.params.id,
      range,
      page: pagination.page,
      limit: pagination.limit,
    });

    res.status(200).json(result);
  } catch (error) {
    sendControllerError(res, error);
  }
};

const listIncidents = async (req, res) => {
  try {
    const pagination = normalizePagination(req.query);
    const query = {};

    if (["open", "resolved"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (req.query.deviceId) {
      validateObjectId(req.query.deviceId, "device ID");
      query.deviceId = req.query.deviceId;
    }

    const [incidents, total] = await Promise.all([
      NetworkIncident.find(query)
        .populate("deviceId", "name hostname ipAddress status checkMethod")
        .sort({ openedAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      NetworkIncident.countDocuments(query),
    ]);

    res.status(200).json({
      count: incidents.length,
      total,
      page: pagination.page,
      pages: Math.ceil(total / pagination.limit) || 1,
      incidents,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

module.exports = {
  createDevice,
  deleteDevice,
  getDeviceById,
  getDeviceHistory,
  getSummary,
  listDevices,
  listIncidents,
  manualCheckDevice,
  pauseDevice,
  resumeDevice,
  updateDevice,
};
