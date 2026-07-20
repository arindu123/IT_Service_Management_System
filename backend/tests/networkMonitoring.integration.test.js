const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

if (process.env.RUN_NETWORK_QA !== "1") {
  test("network monitoring integration QA requires RUN_NETWORK_QA=1", { skip: true }, () => {});
} else {
  require("dotenv").config();
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "network-qa-secret";
  process.env.NETWORK_MONITORING_ENABLED = "true";
  process.env.NETWORK_MONITOR_SIMULATION_MODE = "true";
  process.env.NETWORK_MONITOR_ALLOWED_CIDRS = "10.0.0.0/8";
  process.env.NETWORK_MONITOR_MAX_CONCURRENCY = "10";

  const User = require("../models/User");
  const NetworkDevice = require("../models/NetworkDevice");
  const NetworkCheckHistory = require("../models/NetworkCheckHistory");
  const NetworkIncident = require("../models/NetworkIncident");
  const NetworkMonitorLock = require("../models/NetworkMonitorLock");
  const networkRoutes = require("../routes/networkRoutes");
  const { runDeviceCheck } = require("../services/networkMonitorService");
  const { runMonitoringCycle, getSchedulerSnapshot, runWithConcurrency } = require("../services/networkMonitorScheduler");

  const qaDatabase = `it_service_management_network_qa_${Date.now()}`;
  const qaUri = (() => { const url = new URL(process.env.MONGO_URI); url.pathname = `/${qaDatabase}`; return url.toString(); })();
  let server;
  let baseUrl;
  let adminToken;
  let managementToken;
  let departmentToken;
  let admin;

  const auth = (token) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
  const payload = (overrides = {}) => ({ name: "QA Office PC", ipAddress: "10.20.0.10", deviceType: "pc", department: "QA", building: "HQ", floor: "2", room: "204", description: "always-online", monitoringEnabled: true, checkMethod: "icmp", checkIntervalSeconds: 30, timeoutMs: 1000, failureThreshold: 3, ...overrides });
  const request = async (path, options = {}) => { const started = performance.now(); const response = await fetch(`${baseUrl}${path}`, options); const text = await response.text(); return { response, body: text ? JSON.parse(text) : null, elapsedMs: performance.now() - started }; };

  test.before(async () => {
    assert.match(qaDatabase, /^it_service_management_network_qa_/);
    await mongoose.connect(qaUri, { serverSelectionTimeoutMS: 10000 });
    const password = await bcrypt.hash("QaPassword123!", 10);
    [admin] = await User.create([{ name: "QA Admin", email: "qa-admin@example.test", employeeId: "QA-ADMIN", password, role: "admin" }, { name: "QA Management", email: "qa-management@example.test", employeeId: "QA-MGMT", password, role: "management" }, { name: "QA User", email: "qa-user@example.test", employeeId: "QA-USER", password, role: "department_user" }]);
    const users = await User.find().sort({ employeeId: 1 });
    const byRole = Object.fromEntries(users.map((user) => [user.role, user]));
    adminToken = jwt.sign({ id: byRole.admin._id }, process.env.JWT_SECRET, { expiresIn: "10m" });
    managementToken = jwt.sign({ id: byRole.management._id }, process.env.JWT_SECRET, { expiresIn: "10m" });
    departmentToken = jwt.sign({ id: byRole.department_user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });
    const app = express(); app.use(express.json({ limit: "10mb" })); app.use("/api/network", networkRoutes);
    server = http.createServer(app); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/network`;
  });

  test.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState) { assert.match(mongoose.connection.name, /^it_service_management_network_qa_/); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
  });

  test("API authentication and authorization boundaries", async () => {
    assert.equal((await request("/devices")).response.status, 401);
    assert.equal((await request("/devices", { headers: auth("invalid-token") })).response.status, 401);
    const expired = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await request("/devices", { headers: auth(expired) })).response.status, 401);
    assert.equal((await request("/devices", { headers: auth(managementToken) })).response.status, 200);
    assert.equal((await request("/devices", { method: "POST", headers: auth(managementToken), body: JSON.stringify(payload()) })).response.status, 403);
    assert.equal((await request("/devices", { headers: auth(departmentToken) })).response.status, 403);
  });

  test("device CRUD, persistence, search, filters, pause and resume", async () => {
    const created = await request("/devices", { method: "POST", headers: auth(adminToken), body: JSON.stringify(payload()) });
    assert.equal(created.response.status, 201); const id = created.body.device._id;
    assert.equal((await NetworkDevice.findById(id)).building, "HQ");
    const detail = await request(`/devices/${id}`, { headers: auth(adminToken) }); assert.equal(detail.body.device.name, "QA Office PC");
    const updated = await request(`/devices/${id}`, { method: "PATCH", headers: auth(adminToken), body: JSON.stringify(payload({ name: "QA Office PC Updated" })) }); assert.equal(updated.response.status, 200);
    assert.equal((await request("/devices?search=Updated", { headers: auth(adminToken) })).body.total, 1);
    assert.equal((await request("/devices?deviceType=pc&department=QA&building=HQ", { headers: auth(adminToken) })).body.total, 1);
    const paused = await request(`/devices/${id}/pause`, { method: "POST", headers: auth(adminToken) }); assert.equal(paused.body.device.status, "paused");
    const resumed = await request(`/devices/${id}/resume`, { method: "POST", headers: auth(adminToken) }); assert.equal(resumed.body.device.status, "unknown");
    const removed = await request(`/devices/${id}`, { method: "DELETE", headers: auth(adminToken) }); assert.equal(removed.response.status, 200); assert.equal(await NetworkDevice.countDocuments({ _id: id }), 0);
  });

  test("invalid, duplicate and malicious addresses are rejected safely", async () => {
    const invalidValues = ["127.0.0.1", "localhost", "8.8.8.8", "; rm -rf /", "<script>alert(1)</script>"];
    for (const [index, ipAddress] of invalidValues.entries()) {
      const result = await request("/devices", { method: "POST", headers: auth(adminToken), body: JSON.stringify(payload({ name: `Invalid ${index}`, ipAddress })) });
      assert.equal(result.response.status, 400); assert.equal("error" in result.body, false);
    }
    assert.equal((await request("/devices", { method: "POST", headers: auth(adminToken), body: JSON.stringify({}) })).response.status, 400);
    assert.equal((await request("/devices", { method: "POST", headers: auth(adminToken), body: JSON.stringify(payload({ ipAddress: "10.20.0.20", failureThreshold: "bad" })) })).response.status, 400);
    assert.equal((await request("/devices", { method: "POST", headers: auth(adminToken), body: JSON.stringify(payload({ ipAddress: "10.20.0.30" })) })).response.status, 201);
    assert.equal((await request("/devices", { method: "POST", headers: auth(adminToken), body: JSON.stringify(payload({ name: "Duplicate", ipAddress: "10.20.0.30" })) })).response.status, 400);
  });

  test("online, warning, offline, incident and recovery persistence", async () => {
    const online = await NetworkDevice.create({ ...payload({ name: "Simulation Online", ipAddress: "10.30.0.1" }), createdBy: admin._id, updatedBy: admin._id });
    await runDeviceCheck(online); const onlineSaved = await NetworkDevice.findById(online._id); assert.equal(onlineSaved.status, "online"); assert.ok(onlineSaved.responseTimeMs >= 0); assert.ok(onlineSaved.lastSeenAt); assert.ok(onlineSaved.lastCheckedAt);
    const offline = await NetworkDevice.create({ ...payload({ name: "Simulation Offline", ipAddress: "10.30.0.2", description: "always-offline" }), createdBy: admin._id, updatedBy: admin._id });
    assert.equal((await runDeviceCheck(offline)).device.status, "warning"); assert.equal((await runDeviceCheck(offline)).device.status, "warning"); assert.equal((await runDeviceCheck(offline)).device.status, "offline");
    assert.equal(await NetworkIncident.countDocuments({ deviceId: offline._id, status: "open" }), 1); await runDeviceCheck(offline); assert.equal(await NetworkIncident.countDocuments({ deviceId: offline._id, status: "open" }), 1);
    const incident = await NetworkIncident.findOne({ deviceId: offline._id }); assert.equal(incident.locationSnapshot.building, "HQ");
    offline.description = "always-online"; await offline.save(); await runDeviceCheck(offline); const recovered = await NetworkDevice.findById(offline._id); assert.equal(recovered.status, "online"); assert.equal(recovered.consecutiveFailures, 0); assert.equal(await NetworkIncident.countDocuments({ deviceId: offline._id, status: "resolved" }), 1);
    assert.equal(await NetworkCheckHistory.countDocuments({ deviceId: offline._id }), 5);
  });

  test("history, incidents and summary APIs match database", async () => {
    const device = await NetworkDevice.findOne({ name: "Simulation Offline" });
    const history = await request(`/devices/${device._id}/history?range=24h&limit=2`, { headers: auth(adminToken) }); assert.equal(history.response.status, 200); assert.equal(history.body.history.length, 2); assert.ok(history.body.total >= 5);
    const incidents = await request("/incidents?status=resolved", { headers: auth(adminToken) }); assert.ok(incidents.body.total >= 1);
    const summary = await request("/summary", { headers: auth(adminToken) }); assert.equal(summary.body.total, await NetworkDevice.countDocuments()); assert.equal(summary.body.openIncidentCount, await NetworkIncident.countDocuments({ status: "open" })); assert.ok(summary.elapsedMs < 5000);
  });

  test("scheduler handles 50 devices with concurrency and persists every check", async () => {
    const bulk = Array.from({ length: 50 }, (_, index) => ({ ...payload({ name: `Load Device ${index}`, ipAddress: `10.40.0.${index + 1}` }), createdBy: admin._id, updatedBy: admin._id }));
    await NetworkDevice.insertMany(bulk); const started = performance.now(); await runMonitoringCycle(); const elapsedMs = performance.now() - started; const snapshot = getSchedulerSnapshot(); assert.ok(snapshot.checked >= 50); assert.equal(snapshot.failed, 0); assert.ok(elapsedMs < 30000); assert.ok(await NetworkCheckHistory.countDocuments({ method: "simulation" }) >= 50);
    let active = 0; let maximum = 0; await runWithConcurrency(Array.from({ length: 50 }), 10, async () => { active += 1; maximum = Math.max(maximum, active); await new Promise((resolve) => setTimeout(resolve, 5)); active -= 1; }); assert.ok(maximum <= 10);
    assert.ok(await NetworkMonitorLock.countDocuments() <= 1);
  });

  test("database connection failure is bounded", async () => {
    const connection = mongoose.createConnection("mongodb://127.0.0.1:27099/network_qa_unavailable", { serverSelectionTimeoutMS: 500 });
    await assert.rejects(connection.asPromise()); await connection.close().catch(() => {});
  });
}
