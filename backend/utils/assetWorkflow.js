const actorSnapshot = (user = {}) => ({
  name: user.name || "",
  email: user.email || "",
  employeeId: user.employeeId || "",
  role: user.role || "",
});

const userSnapshot = (user = {}) => ({
  name: user.name || "",
  employeeId: user.employeeId || "",
  department: user.department || "",
  ministry: user.ministry || "",
  designation: user.designation || "",
});

const appendAssetEvent = (asset, event) => {
  asset.lifecycleEvents.push({
    ...event,
    at: event.at || new Date(),
  });
};

const assignAssetToUser = (asset, user, issueDate = new Date()) => {
  asset.assignedTo = user._id;
  asset.assignedUserSnapshot = userSnapshot(user);
  asset.userId = user.employeeId || String(user._id);
  asset.userName = user.name || "";
  asset.issueDate = issueDate;
  asset.status = "issued";
};

const clearAssetAssignment = (asset) => {
  asset.assignedTo = null;
  asset.assignedUserSnapshot = {};
  asset.userId = "";
  asset.userName = "";
  asset.issueDate = null;
};

module.exports = {
  actorSnapshot,
  appendAssetEvent,
  assignAssetToUser,
  clearAssetAssignment,
  userSnapshot,
};
