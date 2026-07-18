const assert = require("node:assert/strict");
const test = require("node:test");

const {
  actorSnapshot,
  appendAssetEvent,
  assignAssetToUser,
  clearAssetAssignment,
  userSnapshot,
} = require("../utils/assetWorkflow");
const Asset = require("../models/Asset");

test("assignAssetToUser marks an asset as issued and stores the user snapshot", () => {
  const issuedAt = new Date("2026-01-02T03:04:05.000Z");
  const user = {
    _id: "user-1",
    employeeId: "EMP-001",
    name: "Semal",
    department: "IT",
    ministry: "Technology",
    designation: "Officer",
  };
  const asset = {};

  assignAssetToUser(asset, user, issuedAt);

  assert.equal(asset.status, "issued");
  assert.equal(asset.assignedTo, "user-1");
  assert.equal(asset.userId, "EMP-001");
  assert.equal(asset.userName, "Semal");
  assert.equal(asset.issueDate, issuedAt);
  assert.deepEqual(asset.assignedUserSnapshot, userSnapshot(user));
});

test("clearAssetAssignment removes the current user from the asset", () => {
  const asset = {
    assignedTo: "user-1",
    assignedUserSnapshot: { name: "Semal" },
    userId: "EMP-001",
    userName: "Semal",
    issueDate: new Date("2026-01-02T03:04:05.000Z"),
  };

  clearAssetAssignment(asset);

  assert.equal(asset.assignedTo, null);
  assert.deepEqual(asset.assignedUserSnapshot, {});
  assert.equal(asset.userId, "");
  assert.equal(asset.userName, "");
  assert.equal(asset.issueDate, null);
});

test("appendAssetEvent keeps actor metadata and adds an event time", () => {
  const asset = { lifecycleEvents: [] };
  const actor = { name: "Admin", email: "admin@example.com", employeeId: "ADM-1", role: "admin" };

  appendAssetEvent(asset, {
    action: "created",
    actor: "admin-1",
    actorSnapshot: actorSnapshot(actor),
    notes: "Asset registered",
  });

  assert.equal(asset.lifecycleEvents.length, 1);
  assert.equal(asset.lifecycleEvents[0].action, "created");
  assert.deepEqual(asset.lifecycleEvents[0].actorSnapshot, actorSnapshot(actor));
  assert.ok(asset.lifecycleEvents[0].at instanceof Date);
});

test("legacy assets can be saved with assetId as the item number", async () => {
  const asset = new Asset({
    assetId: "AST-LEGACY-001",
    serialNumber: "SN-LEGACY-001",
    deviceType: "printer",
    brand: "HP",
    model: "LaserJet",
    location: "IT",
    department: "IT",
  });

  await asset.validate();

  assert.equal(asset.itemNumber, "AST-LEGACY-001");
});
