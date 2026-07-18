const net = require("net");
const networkMonitorConfig = require("../config/networkMonitoring");

const DEVICE_TYPES = new Set([
  "pc",
  "server",
  "printer",
  "router",
  "switch",
  "access_point",
  "cctv_nvr",
  "biometric",
  "other",
]);

const CHECK_METHODS = new Set(["icmp", "tcp", "http", "https"]);
const DEVICE_STATUSES = new Set(["unknown", "online", "warning", "offline", "paused"]);

const normalizeText = (value) => (value === undefined || value === null ? "" : String(value).trim());

const parseInteger = (value, field, min, max) => {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    throw new Error(`${field} must be an integer from ${min} to ${max}`);
  }

  return numberValue;
};

const ipv4ToBigInt = (ipAddress) => {
  const parts = ipAddress.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts.reduce((value, part) => (value << 8n) + BigInt(part), 0n);
};

const isIpv4InCidr = (ipAddress, cidr) => {
  const [networkAddress, prefixValue] = cidr.split("/");
  const prefix = Number(prefixValue);

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32 || net.isIP(networkAddress) !== 4) {
    return false;
  }

  const ipNumber = ipv4ToBigInt(ipAddress);
  const networkNumber = ipv4ToBigInt(networkAddress);

  if (ipNumber === null || networkNumber === null) return false;
  if (prefix === 0) return true;

  const mask = ((1n << BigInt(prefix)) - 1n) << BigInt(32 - prefix);
  return (ipNumber & mask) === (networkNumber & mask);
};

const isUnsafeAddress = (ipAddress, version) => {
  if (version === 6) {
    const lower = ipAddress.toLowerCase();
    return lower === "::" || lower === "::1" || lower.startsWith("ff");
  }

  const parts = ipAddress.split(".").map((part) => Number(part));
  const first = parts[0];

  return (
    ipAddress === "0.0.0.0" ||
    ipAddress === "255.255.255.255" ||
    first === 127 ||
    first >= 224
  );
};

const validateIpAddress = (ipAddress, allowedCidrs = networkMonitorConfig.allowedCidrs) => {
  const normalizedIp = normalizeText(ipAddress).toLowerCase();
  const version = net.isIP(normalizedIp);

  if (!version) {
    throw new Error("IP address must be a valid IPv4 or IPv6 address");
  }

  if (isUnsafeAddress(normalizedIp, version)) {
    throw new Error("Loopback, unspecified, broadcast and multicast addresses are not allowed");
  }

  if (allowedCidrs.length > 0) {
    if (version !== 4) {
      throw new Error("IPv6 monitoring requires NETWORK_MONITOR_ALLOWED_CIDRS to be configured without IPv4-only ranges");
    }

    const allowed = allowedCidrs.some((cidr) => isIpv4InCidr(normalizedIp, cidr));

    if (!allowed) {
      throw new Error("IP address is outside the allowed monitoring network ranges");
    }
  }

  return normalizedIp;
};

const normalizeOptionalPort = (value, checkMethod) => {
  const isEmpty = value === undefined || value === null || value === "";

  if (isEmpty) {
    if (checkMethod === "tcp") {
      throw new Error("TCP port is required for TCP checks");
    }

    return null;
  }

  return parseInteger(value, "TCP port", 1, 65535);
};

const normalizeNetworkDevicePayload = (payload, currentDevice = null) => {
  const checkMethod = normalizeText(payload.checkMethod || currentDevice?.checkMethod || "icmp").toLowerCase();
  const deviceType = normalizeText(payload.deviceType || currentDevice?.deviceType || "pc").toLowerCase();

  if (!CHECK_METHODS.has(checkMethod)) {
    throw new Error("Check method must be icmp, tcp, http or https");
  }

  if (!DEVICE_TYPES.has(deviceType)) {
    throw new Error("Device type is not supported");
  }

  const name = normalizeText(payload.name ?? currentDevice?.name);

  if (!name) {
    throw new Error("Device name is required");
  }

  const ipAddress = validateIpAddress(payload.ipAddress ?? currentDevice?.ipAddress);
  const monitoringEnabled =
    payload.monitoringEnabled === undefined
      ? currentDevice?.monitoringEnabled ?? true
      : Boolean(payload.monitoringEnabled);

  const normalized = {
    name,
    hostname: normalizeText(payload.hostname ?? currentDevice?.hostname),
    ipAddress,
    deviceType,
    department: normalizeText(payload.department ?? currentDevice?.department),
    building: normalizeText(payload.building ?? currentDevice?.building),
    floor: normalizeText(payload.floor ?? currentDevice?.floor),
    room: normalizeText(payload.room ?? currentDevice?.room),
    description: normalizeText(payload.description ?? currentDevice?.description),
    monitoringEnabled,
    checkMethod,
    tcpPort: normalizeOptionalPort(payload.tcpPort ?? currentDevice?.tcpPort, checkMethod),
    checkIntervalSeconds: parseInteger(
      payload.checkIntervalSeconds ?? currentDevice?.checkIntervalSeconds ?? networkMonitorConfig.defaultIntervalSeconds,
      "Check interval",
      30,
      86400
    ),
    timeoutMs: parseInteger(
      payload.timeoutMs ?? currentDevice?.timeoutMs ?? networkMonitorConfig.timeoutMs,
      "Timeout",
      1000,
      10000
    ),
    failureThreshold: parseInteger(
      payload.failureThreshold ?? currentDevice?.failureThreshold ?? networkMonitorConfig.failureThreshold,
      "Failure threshold",
      1,
      10
    ),
    status: monitoringEnabled ? currentDevice?.status || "unknown" : "paused",
  };

  if (payload.status && DEVICE_STATUSES.has(payload.status)) {
    normalized.status = payload.status;
  }

  if (monitoringEnabled && normalized.status === "paused") {
    normalized.status = "unknown";
  }

  return normalized;
};

const normalizePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const escapeRegex = (value) => normalizeText(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
  CHECK_METHODS,
  DEVICE_STATUSES,
  DEVICE_TYPES,
  escapeRegex,
  normalizeNetworkDevicePayload,
  normalizePagination,
  validateIpAddress,
};
