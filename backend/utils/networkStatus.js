const getNextDeviceState = ({ success, currentStatus = "unknown", currentFailures = 0, failureThreshold = 3 }) => {
  if (success) {
    return {
      status: "online",
      consecutiveFailures: 0,
      statusChanged: currentStatus !== "online",
      shouldOpenIncident: false,
      shouldResolveIncident: true,
    };
  }

  const consecutiveFailures = currentFailures + 1;
  const status = consecutiveFailures >= failureThreshold ? "offline" : "warning";

  return {
    status,
    consecutiveFailures,
    statusChanged: currentStatus !== status,
    shouldOpenIncident: status === "offline" && currentStatus !== "offline",
    shouldResolveIncident: false,
  };
};

const buildDeviceStatusUpdate = ({
  success,
  currentStatus = "unknown",
  currentFailures = 0,
  currentLastSeenAt = null,
  currentLastStatusChangedAt = null,
  failureThreshold = 3,
  checkedAt = new Date(),
  responseTimeMs = null,
  errorCode = "",
  errorMessage = "",
}) => {
  const nextState = getNextDeviceState({
    success,
    currentStatus,
    currentFailures,
    failureThreshold,
  });

  return {
    ...nextState,
    update: {
      status: nextState.status,
      consecutiveFailures: nextState.consecutiveFailures,
      lastCheckedAt: checkedAt,
      lastSeenAt: success ? checkedAt : currentLastSeenAt,
      lastStatusChangedAt: nextState.statusChanged ? checkedAt : currentLastStatusChangedAt,
      responseTimeMs: success ? responseTimeMs : null,
      lastErrorCode: success ? "" : errorCode || "",
      lastErrorMessage: success ? "" : errorMessage || "",
    },
  };
};

const calculateUptime = (history = []) => {
  if (!history.length) return 0;

  const successfulChecks = history.filter((item) => item.status === "online").length;
  return Math.round((successfulChecks / history.length) * 100);
};

module.exports = {
  buildDeviceStatusUpdate,
  getNextDeviceState,
  calculateUptime,
};
