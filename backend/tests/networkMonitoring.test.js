const assert = require("node:assert/strict");
const test = require("node:test");
const { buildDeviceStatusUpdate, getNextDeviceState, calculateUptime } = require("../utils/networkStatus");
const { isSuccessfulPing, parsePingResult } = require("../utils/pingParser");
const { normalizeNetworkDevicePayload, validateIpAddress } = require("../utils/networkValidation");
const { runWithConcurrency } = require("../services/networkMonitorScheduler");

test("validates and normalizes a monitored LAN device", () => {
  const payload = normalizeNetworkDevicePayload({
    name: " Accounts PC ",
    ipAddress: "192.168.1.25",
    deviceType: "pc",
    checkMethod: "icmp",
    checkIntervalSeconds: 60,
    timeoutMs: 3000,
    failureThreshold: 3,
  });

  assert.equal(payload.name, "Accounts PC");
  assert.equal(payload.ipAddress, "192.168.1.25");
  assert.equal(payload.status, "unknown");
  assert.equal(payload.monitoringEnabled, true);
});

test("rejects unsafe or out-of-range IP addresses", () => {
  assert.throws(() => validateIpAddress("127.0.0.1"), /Loopback/);
  assert.throws(() => validateIpAddress("8.8.8.8"), /outside the allowed/);
  assert.throws(() => validateIpAddress("not-an-ip"), /valid IPv4 or IPv6/);
});

test("requires a port for TCP checks", () => {
  assert.throws(
    () => normalizeNetworkDevicePayload({
      name: "Switch SSH",
      ipAddress: "192.168.1.30",
      deviceType: "switch",
      checkMethod: "tcp",
      checkIntervalSeconds: 60,
      timeoutMs: 3000,
      failureThreshold: 3,
    }),
    /TCP port is required/
  );
});

test("moves from unknown to online after a successful check", () => {
  const next = getNextDeviceState({
    success: true,
    currentStatus: "unknown",
    currentFailures: 2,
    failureThreshold: 3,
  });

  assert.equal(next.status, "online");
  assert.equal(next.consecutiveFailures, 0);
  assert.equal(next.shouldResolveIncident, true);
});

test("uses warning below threshold and offline at threshold", () => {
  const warning = getNextDeviceState({
    success: false,
    currentStatus: "online",
    currentFailures: 0,
    failureThreshold: 3,
  });
  const offline = getNextDeviceState({
    success: false,
    currentStatus: "warning",
    currentFailures: 2,
    failureThreshold: 3,
  });

  assert.equal(warning.status, "warning");
  assert.equal(warning.shouldOpenIncident, false);
  assert.equal(offline.status, "offline");
  assert.equal(offline.shouldOpenIncident, true);
});

test("does not request duplicate incident creation while already offline", () => {
  const next = getNextDeviceState({
    success: false,
    currentStatus: "offline",
    currentFailures: 3,
    failureThreshold: 3,
  });

  assert.equal(next.status, "offline");
  assert.equal(next.shouldOpenIncident, false);
});

test("recovers from offline to online and resolves an incident", () => {
  const next = getNextDeviceState({
    success: true,
    currentStatus: "offline",
    currentFailures: 3,
    failureThreshold: 3,
  });

  assert.equal(next.status, "online");
  assert.equal(next.consecutiveFailures, 0);
  assert.equal(next.shouldResolveIncident, true);
});

test("preserves lastSeenAt during a failed check", () => {
  const lastSeenAt = new Date("2026-07-14T08:00:00.000Z");
  const checkedAt = new Date("2026-07-14T08:05:00.000Z");
  const next = buildDeviceStatusUpdate({
    success: false,
    currentStatus: "online",
    currentFailures: 0,
    currentLastSeenAt: lastSeenAt,
    failureThreshold: 3,
    checkedAt,
    errorCode: "PING_FAILED",
    errorMessage: "Destination Host Unreachable",
  });

  assert.equal(next.update.status, "warning");
  assert.equal(next.update.lastCheckedAt, checkedAt);
  assert.equal(next.update.lastSeenAt, lastSeenAt);
});

test("calculates uptime from check history", () => {
  const uptime = calculateUptime([
    { status: "online" },
    { status: "failed" },
    { status: "online" },
    { status: "error" },
  ]);

  assert.equal(uptime, 50);
});

test("Windows ping parser treats destination host unreachable as failed", () => {
  const output = [
    "Pinging 192.168.1.168 with 32 bytes of data:",
    "Reply from 192.168.1.166: Destination host unreachable.",
  ].join("\n");

  assert.equal(isSuccessfulPing({ alive: true, output, numeric_host: "192.168.1.168" }, "192.168.1.168"), false);
  assert.equal(parsePingResult({ alive: true, output, numeric_host: "192.168.1.168" }, "192.168.1.168").ok, false);
});

test("Windows ping parser treats request timed out as failed", () => {
  const output = [
    "Pinging 192.168.1.168 with 32 bytes of data:",
    "Request timed out.",
  ].join("\n");

  assert.equal(isSuccessfulPing({ alive: false, output, numeric_host: "192.168.1.168" }, "192.168.1.168"), false);
});

test("Windows ping parser accepts a real reply from the target IP", () => {
  const output = [
    "Pinging 192.168.1.168 with 32 bytes of data:",
    "Reply from 192.168.1.168: bytes=32 time=11ms TTL=64",
  ].join("\n");
  const result = parsePingResult({ alive: true, output, numeric_host: "192.168.1.168" }, "192.168.1.168");

  assert.equal(result.ok, true);
  assert.equal(result.responseTimeMs, 11);
});

test("Windows ping parser ignores misleading zero packet-loss statistics", () => {
  const output = [
    "Pinging 192.168.1.168 with 32 bytes of data:",
    "Reply from 192.168.1.166: Destination host unreachable.",
    "Reply from 192.168.1.166: Destination host unreachable.",
    "Reply from 192.168.1.166: Destination host unreachable.",
    "Reply from 192.168.1.166: Destination host unreachable.",
    "Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),",
  ].join("\n");

  assert.equal(isSuccessfulPing({ alive: true, output, numeric_host: "192.168.1.168" }, "192.168.1.168"), false);
});

test("scheduler concurrency helper continues after one device check error", async () => {
  const processed = [];
  const results = await runWithConcurrency([1, 2, 3], 1, async (item) => {
    processed.push(item);

    if (item === 2) {
      throw new Error("simulated check failure");
    }

    return { item };
  });

  assert.deepEqual(processed, [1, 2, 3]);
  assert.equal(results[0].item, 1);
  assert.equal(results[1].error.message, "simulated check failure");
  assert.equal(results[2].item, 3);
});
