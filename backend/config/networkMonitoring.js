const DEFAULT_ALLOWED_CIDRS = "192.168.0.0/16,10.0.0.0/8,172.16.0.0/12";

const readBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};

const readNumber = (value, fallback, min, max) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return fallback;

  return Math.min(Math.max(Math.trunc(numberValue), min), max);
};

const readCidrs = (value) => {
  const source = value === undefined ? DEFAULT_ALLOWED_CIDRS : value;

  return String(source || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const networkMonitorConfig = {
  enabled: readBoolean(process.env.NETWORK_MONITORING_ENABLED, true),
  defaultIntervalSeconds: readNumber(process.env.NETWORK_MONITOR_DEFAULT_INTERVAL_SECONDS, 60, 30, 86400),
  timeoutMs: readNumber(process.env.NETWORK_MONITOR_TIMEOUT_MS, 3000, 1000, 10000),
  failureThreshold: readNumber(process.env.NETWORK_MONITOR_FAILURE_THRESHOLD, 3, 1, 10),
  maxConcurrency: readNumber(process.env.NETWORK_MONITOR_MAX_CONCURRENCY, 10, 1, 50),
  historyRetentionDays: readNumber(process.env.NETWORK_MONITOR_HISTORY_RETENTION_DAYS, 30, 1, 365),
  allowedCidrs: readCidrs(process.env.NETWORK_MONITOR_ALLOWED_CIDRS),
  simulationMode:
    readBoolean(process.env.NETWORK_MONITOR_SIMULATION_MODE, false) &&
    process.env.NODE_ENV !== "production",
  manualCheckCooldownMs: 10000,
};

module.exports = networkMonitorConfig;
