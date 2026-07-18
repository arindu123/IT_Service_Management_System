const childProcess = require("child_process");
const http = require("http");
const https = require("https");
const net = require("net");
const networkMonitorConfig = require("../config/networkMonitoring");
const { parsePingResult } = require("../utils/pingParser");

const simulationCounters = new Map();

const createResult = ({
  ok,
  method,
  responseTimeMs = null,
  errorCode = "",
  errorMessage = "",
  rawOutput = "",
  exitCode = null,
  alive = null,
}) => ({
  ok,
  method,
  responseTimeMs,
  errorCode,
  errorMessage,
  rawOutput,
  exitCode,
  alive,
});

const runIcmpCheck = (device) => {
  const startedAt = Date.now();
  const isWindows = process.platform === "win32";
  const args = isWindows
    ? ["-n", "1", "-w", String(device.timeoutMs), device.ipAddress]
    : ["-c", "1", "-W", String(Math.ceil(device.timeoutMs / 1000)), device.ipAddress];

  return new Promise((resolve) => {
    const ping = childProcess.spawn("ping", args, {
      shell: false,
      windowsHide: true,
    });

    let output = "";
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const timeout = setTimeout(() => {
      ping.kill();
      finish(createResult({
        ok: false,
        method: "icmp",
        errorCode: "TIMEOUT",
        errorMessage: "Ping check timed out",
      }));
    }, device.timeoutMs + 1000);

    ping.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    ping.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    ping.on("error", (error) => {
      clearTimeout(timeout);
      finish(createResult({
        ok: false,
        method: "icmp",
        errorCode: "PING_UNAVAILABLE",
        errorMessage: error.message,
      }));
    });

    ping.on("close", (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startedAt;
      const alive = code === 0;
      const parsed = parsePingResult(
        {
          alive,
          output,
          numeric_host: device.ipAddress,
          exitCode: code,
        },
        device.ipAddress,
        duration
      );

      finish(
        createResult({
          ok: parsed.ok,
          method: "icmp",
          responseTimeMs: parsed.responseTimeMs,
          errorCode: parsed.errorCode,
          errorMessage: parsed.errorMessage,
          rawOutput: output,
          exitCode: code,
          alive,
        })
      );
    });
  });
};

const runTcpCheck = (device) => {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: device.ipAddress,
      port: device.tcpPort,
    });

    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(device.timeoutMs);

    socket.on("connect", () => {
      finish(createResult({
        ok: true,
        method: "tcp",
        responseTimeMs: Date.now() - startedAt,
      }));
    });

    socket.on("timeout", () => {
      finish(createResult({
        ok: false,
        method: "tcp",
        errorCode: "TIMEOUT",
        errorMessage: "TCP connection timed out",
      }));
    });

    socket.on("error", (error) => {
      finish(createResult({
        ok: false,
        method: "tcp",
        errorCode: error.code || "TCP_FAILED",
        errorMessage: "TCP connection failed",
      }));
    });
  });
};

const runHttpCheck = (device) => {
  const startedAt = Date.now();
  const client = device.checkMethod === "https" ? https : http;
  const port = device.tcpPort || (device.checkMethod === "https" ? 443 : 80);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (request, result) => {
      if (settled) return;
      settled = true;
      request.destroy();
      resolve(result);
    };

    const request = client.request(
      {
        hostname: device.ipAddress,
        port,
        path: "/",
        method: "HEAD",
        timeout: device.timeoutMs,
      },
      (response) => {
        response.resume();
        finish(request, createResult({
          ok: response.statusCode < 500,
          method: device.checkMethod,
          responseTimeMs: Date.now() - startedAt,
          errorCode: response.statusCode < 500 ? "" : "HTTP_STATUS",
          errorMessage: response.statusCode < 500 ? "" : `HTTP ${response.statusCode}`,
        }));
      }
    );

    request.on("timeout", () => {
      finish(request, createResult({
        ok: false,
        method: device.checkMethod,
        errorCode: "TIMEOUT",
        errorMessage: "HTTP check timed out",
      }));
    });

    request.on("error", (error) => {
      finish(request, createResult({
        ok: false,
        method: device.checkMethod,
        errorCode: error.code || "HTTP_FAILED",
        errorMessage: "HTTP check failed",
      }));
    });

    request.end();
  });
};

const getSimulationScenario = (device) => {
  const source = `${device.hostname || ""} ${device.description || ""}`.toLowerCase();
  const scenarios = [
    "always-offline",
    "slow-response",
    "intermittent",
    "flapping",
    "timeout",
    "recovery-after-three-failures",
  ];

  return scenarios.find((scenario) => source.includes(scenario)) || "always-online";
};

const runSimulationCheck = async (device) => {
  const scenario = getSimulationScenario(device);
  const key = String(device._id);
  const count = (simulationCounters.get(key) || 0) + 1;
  simulationCounters.set(key, count);

  if (scenario === "always-offline") {
    return createResult({
      ok: false,
      method: "simulation",
      errorCode: "SIM_OFFLINE",
      errorMessage: "Simulated offline device",
    });
  }

  if (scenario === "timeout") {
    return createResult({
      ok: false,
      method: "simulation",
      errorCode: "TIMEOUT",
      errorMessage: "Simulated timeout",
    });
  }

  if (scenario === "intermittent" || scenario === "flapping") {
    const ok = count % 3 !== 0;
    return createResult({
      ok,
      method: "simulation",
      responseTimeMs: ok ? 42 : null,
      errorCode: ok ? "" : "SIM_INTERMITTENT",
      errorMessage: ok ? "" : "Simulated intermittent failure",
    });
  }

  if (scenario === "recovery-after-three-failures") {
    const cyclePosition = ((count - 1) % 6) + 1;
    const ok = cyclePosition > 3;
    return createResult({
      ok,
      method: "simulation",
      responseTimeMs: ok ? 38 : null,
      errorCode: ok ? "" : "SIM_RECOVERY",
      errorMessage: ok ? "" : "Simulated recovery sequence failure",
    });
  }

  return createResult({
    ok: true,
    method: "simulation",
    responseTimeMs: scenario === "slow-response" ? 850 : 18,
  });
};

const checkDeviceReachability = async (device) => {
  if (networkMonitorConfig.simulationMode) {
    return runSimulationCheck(device);
  }

  if (device.checkMethod === "tcp") return runTcpCheck(device);
  if (device.checkMethod === "http" || device.checkMethod === "https") return runHttpCheck(device);
  return runIcmpCheck(device);
};

module.exports = {
  checkDeviceReachability,
};
