const NetworkCheckHistory = require("../models/NetworkCheckHistory");
const NetworkDevice = require("../models/NetworkDevice");
const NetworkIncident = require("../models/NetworkIncident");
const { checkDeviceReachability } = require("./networkCheckProvider");
const { buildDeviceStatusUpdate, calculateUptime } = require("../utils/networkStatus");
const { summarizePingOutput } = require("../utils/pingParser");

const buildLocationSnapshot = (device) => ({
  department: device.department || "",
  building: device.building || "",
  floor: device.floor || "",
  room: device.room || "",
});

const ensureOfflineIncident = async (device) => {
  try {
    return await NetworkIncident.create({
      deviceId: device._id,
      type: "DEVICE_OFFLINE",
      severity: "critical",
      status: "open",
      message: `${device.name} is offline`,
      failureCount: device.consecutiveFailures,
      locationSnapshot: buildLocationSnapshot(device),
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return NetworkIncident.findOne({
      deviceId: device._id,
      type: "DEVICE_OFFLINE",
      status: "open",
    });
  }
};

const resolveOpenIncident = async (deviceId) => {
  return NetworkIncident.findOneAndUpdate(
    {
      deviceId,
      type: "DEVICE_OFFLINE",
      status: "open",
    },
    {
      $set: {
        status: "resolved",
        resolvedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
};

const recordHistory = async (device, result, checkedAt) => {
  return NetworkCheckHistory.create({
    deviceId: device._id,
    status: result.ok ? "online" : result.errorCode === "CHECK_ERROR" ? "error" : "failed",
    method: result.method,
    responseTimeMs: result.responseTimeMs,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    checkedAt,
  });
};

const runDeviceCheck = async (deviceInput, options = {}) => {
  const device = typeof deviceInput === "string" ? await NetworkDevice.findById(deviceInput) : deviceInput;

  if (!device) {
    throw new Error("Device not found");
  }

  const checkedAt = new Date();

  if (!device.monitoringEnabled && !options.manual) {
    if (device.status !== "paused") {
      device.status = "paused";
      device.lastStatusChangedAt = checkedAt;
      await device.save();
    }

    return {
      skipped: true,
      device,
      check: null,
      incident: null,
    };
  }

  let result;
  const previousStatus = device.status;

  if (options.logChecks) {
    console.log(`[Network Monitor] Checking ${device.name} (${device.ipAddress})`);
  }

  try {
    result = await checkDeviceReachability(device);
  } catch (error) {
    result = {
      ok: false,
      method: device.checkMethod,
      responseTimeMs: null,
      errorCode: "CHECK_ERROR",
      errorMessage: error.message,
    };
  }

  if (options.logChecks) {
    const resultLabel = result.ok ? "successful" : "failed";
    const rawOutput = process.env.NODE_ENV === "production" ? "" : summarizePingOutput(result.rawOutput || "");

    if (rawOutput) {
      console.log(
        `[Network Monitor] Raw result: device="${device.name}", alive=${result.alive}, exitCode=${result.exitCode}, output="${rawOutput}"`
      );
    }

    console.log(
      `[Network Monitor] Parsed result: device="${device.name}", result=${resultLabel}, error="${result.errorMessage || ""}"`
    );
  }

  const history = await recordHistory(device, result, checkedAt);

  if (!device.monitoringEnabled && options.manual) {
    device.lastCheckedAt = checkedAt;
    device.responseTimeMs = result.ok ? result.responseTimeMs : null;
    device.lastErrorCode = result.errorCode || "";
    device.lastErrorMessage = result.errorMessage || "";

    if (result.ok) {
      device.lastSeenAt = checkedAt;
    }

    await device.save();
    return {
      skipped: false,
      device,
      check: history,
      incident: null,
    };
  }

  const nextState = buildDeviceStatusUpdate({
    success: result.ok,
    currentStatus: device.status,
    currentFailures: device.consecutiveFailures,
    currentLastSeenAt: device.lastSeenAt,
    currentLastStatusChangedAt: device.lastStatusChangedAt,
    failureThreshold: device.failureThreshold,
    checkedAt,
    responseTimeMs: result.responseTimeMs,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
  });

  Object.assign(device, nextState.update);

  await device.save();

  let incident = null;

  if (nextState.shouldOpenIncident) {
    incident = await ensureOfflineIncident(device);
  }

  if (nextState.shouldResolveIncident) {
    incident = await resolveOpenIncident(device._id);
  }

  if (options.logChecks) {
    console.log(
      `[Network Monitor] ${device.name}: ${previousStatus} -> ${device.status}, failures=${device.consecutiveFailures}`
    );
  }

  return {
    skipped: false,
    device,
    check: history,
    incident,
    previousStatus,
  };
};

const getHistoryWithUptime = async ({ deviceId, range = "24h", page = 1, limit = 50 }) => {
  const rangeMs = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  }[range] || 24 * 60 * 60 * 1000;

  const since = new Date(Date.now() - rangeMs);
  const query = {
    deviceId,
    checkedAt: { $gte: since },
  };
  const skip = (page - 1) * limit;
  const [items, total, uptimeHistory] = await Promise.all([
    NetworkCheckHistory.find(query).sort({ checkedAt: -1 }).skip(skip).limit(limit),
    NetworkCheckHistory.countDocuments(query),
    NetworkCheckHistory.find(query).select("status"),
  ]);

  return {
    history: items,
    total,
    uptimePercent: calculateUptime(uptimeHistory),
    range,
    page,
    pages: Math.ceil(total / limit) || 1,
  };
};

module.exports = {
  getHistoryWithUptime,
  runDeviceCheck,
};
