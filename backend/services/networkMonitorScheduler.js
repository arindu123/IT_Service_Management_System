const os = require("os");
const NetworkCheckHistory = require("../models/NetworkCheckHistory");
const NetworkDevice = require("../models/NetworkDevice");
const NetworkMonitorLock = require("../models/NetworkMonitorLock");
const networkMonitorConfig = require("../config/networkMonitoring");
const { runDeviceCheck } = require("./networkMonitorService");

const LOCK_NAME = "network-monitoring-scheduler";
const OWNER_ID = `${os.hostname()}-${process.pid}`;
const LOCK_LEASE_MS = 120000;

let schedulerTimer = null;
let cycleRunning = false;
let cleanupLastRunAt = null;
let lastCycleSnapshot = {
  lastCycleAt: null,
  lastCycleDurationMs: null,
  checked: 0,
  skipped: 0,
  failed: 0,
  message: "Scheduler has not run yet",
};

const inFlightDeviceIds = new Set();

const parseOwner = (owner = "") => {
  const marker = owner.lastIndexOf("-");
  if (marker === -1) return null;

  const hostname = owner.slice(0, marker);
  const pid = Number(owner.slice(marker + 1));

  if (!hostname || !Number.isInteger(pid)) return null;

  return { hostname, pid };
};

const isOwnerProcessAlive = (owner) => {
  const parsedOwner = parseOwner(owner);

  if (!parsedOwner || parsedOwner.hostname !== os.hostname()) {
    return true;
  }

  if (parsedOwner.pid === process.pid) {
    return true;
  }

  try {
    process.kill(parsedOwner.pid, 0);
    return true;
  } catch {
    return false;
  }
};

const acquireLock = async () => {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LOCK_LEASE_MS);

  try {
    const lock = await NetworkMonitorLock.findOneAndUpdate(
      {
        name: LOCK_NAME,
        $or: [{ leaseUntil: { $lte: now } }, { owner: OWNER_ID }],
      },
      {
        $set: {
          owner: OWNER_ID,
          leaseUntil,
        },
      },
      { returnDocument: "after" }
    );

    if (lock) return true;

    const existingLock = await NetworkMonitorLock.findOne({ name: LOCK_NAME });

    const existingOwner = parseOwner(existingLock?.owner);
    const canReclaimSameHostDevLock =
      process.env.NODE_ENV !== "production" &&
      existingOwner?.hostname === os.hostname() &&
      existingOwner.pid !== process.pid;

    if (existingLock && (!isOwnerProcessAlive(existingLock.owner) || canReclaimSameHostDevLock)) {
      const reclaimedLock = await NetworkMonitorLock.findOneAndUpdate(
        {
          _id: existingLock._id,
          owner: existingLock.owner,
        },
        {
          $set: {
            owner: OWNER_ID,
            leaseUntil,
          },
        },
        { returnDocument: "after" }
      );

      if (reclaimedLock) {
        console.log(`[Network Monitor] Reclaimed scheduler lock from stopped process ${existingLock.owner}`);
        return true;
      }
    }

    await NetworkMonitorLock.create({
      name: LOCK_NAME,
      owner: OWNER_ID,
      leaseUntil,
    });

    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    console.error(`Network monitor lock error: ${error.message}`);
    return false;
  }
};

const markCycleComplete = async (checkedAt) => {
  try {
    await NetworkMonitorLock.updateOne(
      {
        name: LOCK_NAME,
        owner: OWNER_ID,
      },
      {
        $set: {
          lastCycleAt: checkedAt,
          leaseUntil: new Date(Date.now() + LOCK_LEASE_MS),
        },
      }
    );
  } catch (error) {
    console.error(`Network monitor lock update failed: ${error.message}`);
  }
};

const runWithConcurrency = async (items, limit, worker) => {
  const results = [];
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;

      try {
        results[currentIndex] = await worker(items[currentIndex]);
      } catch (error) {
        results[currentIndex] = { error };
      }
    }
  });

  await Promise.allSettled(workers);
  return results;
};

const getDueDevices = async (now) => {
  const enabledDevices = await NetworkDevice.find({ monitoringEnabled: true }).sort({ lastCheckedAt: 1 });

  return enabledDevices.filter((device) => {
    if (inFlightDeviceIds.has(String(device._id))) return false;
    if (!device.lastCheckedAt) return true;

    const dueAt = new Date(device.lastCheckedAt).getTime() + device.checkIntervalSeconds * 1000;
    return dueAt <= now.getTime();
  });
};

const cleanupOldHistory = async (now) => {
  if (cleanupLastRunAt && now.getTime() - cleanupLastRunAt.getTime() < 24 * 60 * 60 * 1000) {
    return;
  }

  cleanupLastRunAt = now;
  const cutoff = new Date(now.getTime() - networkMonitorConfig.historyRetentionDays * 24 * 60 * 60 * 1000);
  const result = await NetworkCheckHistory.deleteMany({ checkedAt: { $lt: cutoff } });

  if (result.deletedCount > 0) {
    console.log(`Network monitor cleaned ${result.deletedCount} old history record(s)`);
  }
};

const runMonitoringCycle = async () => {
  if (cycleRunning) {
    console.log("[Network Monitor] Cycle skipped: previous cycle is still running");
    return;
  }

  if (!networkMonitorConfig.enabled) return;

  const hasLock = await acquireLock();
  if (!hasLock) {
    console.log("[Network Monitor] Cycle skipped: scheduler lock is held by another process");
    return;
  }

  cycleRunning = true;
  const cycleStartedAt = new Date();
  const startedMs = Date.now();

  try {
    console.log("[Network Monitor] Cycle started");
    await cleanupOldHistory(cycleStartedAt);
    const devices = await getDueDevices(cycleStartedAt);

    if (devices.length === 0) {
      lastCycleSnapshot = {
        lastCycleAt: cycleStartedAt,
        lastCycleDurationMs: Date.now() - startedMs,
        checked: 0,
        skipped: 0,
        failed: 0,
        message: "No devices due",
      };
      console.log("[Network Monitor] Cycle completed: checked=0, online=0, failed=0, message=No devices due");
      await markCycleComplete(cycleStartedAt);
      return;
    }

    console.log(`[Network Monitor] ${devices.length} due device(s) loaded from MongoDB`);

    const results = await runWithConcurrency(
      devices,
      networkMonitorConfig.maxConcurrency,
      async (device) => {
        const deviceId = String(device._id);
        inFlightDeviceIds.add(deviceId);

        try {
          return await runDeviceCheck(device, { logChecks: true });
        } catch (error) {
          console.error(`[Network Monitor] Check failed for ${device.name}: ${error.message}`);
          return { error };
        } finally {
          inFlightDeviceIds.delete(deviceId);
        }
      }
    );

    const failed = results.filter((result) => result?.error).length;
    const skipped = results.filter((result) => result?.skipped).length;
    const online = results.filter((result) => result?.device?.status === "online").length;
    const failedChecks = results.filter((result) => result?.check && result.check.status !== "online").length + failed;

    lastCycleSnapshot = {
      lastCycleAt: cycleStartedAt,
      lastCycleDurationMs: Date.now() - startedMs,
      checked: devices.length - skipped,
      skipped,
      failed,
      message: "Cycle completed",
    };

    console.log(
      `[Network Monitor] Cycle completed: checked=${lastCycleSnapshot.checked}, online=${online}, failed=${failedChecks}, duration=${lastCycleSnapshot.lastCycleDurationMs}ms`
    );

    await markCycleComplete(cycleStartedAt);
  } catch (error) {
    lastCycleSnapshot = {
      lastCycleAt: cycleStartedAt,
      lastCycleDurationMs: Date.now() - startedMs,
      checked: 0,
      skipped: 0,
      failed: 1,
      message: error.message,
    };
    console.error(`[Network Monitor] Cycle error: ${error.message}`);
  } finally {
    cycleRunning = false;
  }
};

const startNetworkMonitorScheduler = () => {
  if (!networkMonitorConfig.enabled) {
    console.log("Network monitoring scheduler disabled");
    return;
  }

  if (global.__networkMonitorSchedulerStarted) {
    return;
  }

  global.__networkMonitorSchedulerStarted = true;

  const tickMs = Math.max(10000, Math.min(networkMonitorConfig.defaultIntervalSeconds, 30) * 1000);
  schedulerTimer = setInterval(runMonitoringCycle, tickMs);
  schedulerTimer.unref?.();

  setTimeout(runMonitoringCycle, 5000).unref?.();
  console.log(`[Network Monitor] Scheduler started with ${networkMonitorConfig.maxConcurrency} max concurrent check(s)`);
};

const getSchedulerSnapshot = () => lastCycleSnapshot;

module.exports = {
  getSchedulerSnapshot,
  runMonitoringCycle,
  runWithConcurrency,
  startNetworkMonitorScheduler,
};
