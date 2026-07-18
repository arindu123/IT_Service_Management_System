const FAILURE_MESSAGES = [
  "destination host unreachable",
  "request timed out",
  "general failure",
  "transmit failed",
  "ttl expired",
  "could not find host",
  "ping request could not find host",
];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePingResponseTime = (output, fallbackMs = null) => {
  if (/time<\s*1\s*ms/i.test(output)) return 1;

  const match = String(output).match(/time[=<]\s*([\d.]+)\s*ms/i);
  const parsed = match ? Number(match[1]) : null;

  return Number.isFinite(parsed) ? parsed : fallbackMs;
};

const hasFailureMessage = (output) => {
  const normalizedOutput = String(output || "").toLowerCase();
  return FAILURE_MESSAGES.some((message) => normalizedOutput.includes(message));
};

const hasReplyFromTarget = (output, targetIp) => {
  const normalizedOutput = String(output || "");
  const normalizedTarget = String(targetIp || "").trim();

  if (!normalizedOutput || !normalizedTarget) return false;

  const escapedTarget = escapeRegex(normalizedTarget);
  const successPatterns = [
    new RegExp(`^\\s*reply from ${escapedTarget}(?:\\s|:)`, "im"),
    new RegExp(`^\\s*\\d+ bytes from ${escapedTarget}(?:\\s|:)`, "im"),
    new RegExp(`^\\s*bytes from ${escapedTarget}(?:\\s|:)`, "im"),
  ];

  return successPatterns.some((pattern) => pattern.test(normalizedOutput));
};

const isSuccessfulPing = (result = {}, targetIp) => {
  const output = String(result.output || "");
  const numericHost = result.numeric_host || result.numericHost || targetIp;

  if (hasFailureMessage(output)) {
    return false;
  }

  if (result.alive !== true) {
    return false;
  }

  return hasReplyFromTarget(output, numericHost);
};

const parsePingResult = (result = {}, targetIp, fallbackMs = null) => {
  const ok = isSuccessfulPing(result, targetIp);

  if (ok) {
    return {
      ok: true,
      responseTimeMs: parsePingResponseTime(result.output, fallbackMs),
      errorCode: "",
      errorMessage: "",
    };
  }

  const output = String(result.output || "");
  const lowerOutput = output.toLowerCase();
  const matchedFailure = FAILURE_MESSAGES.find((message) => lowerOutput.includes(message));

  return {
    ok: false,
    responseTimeMs: null,
    errorCode: matchedFailure ? "PING_FAILED" : "NO_TARGET_REPLY",
    errorMessage: matchedFailure
      ? matchedFailure.replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "No successful ICMP reply from the target device",
  };
};

const summarizePingOutput = (output = "", maxLength = 300) =>
  String(output)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

module.exports = {
  FAILURE_MESSAGES,
  hasReplyFromTarget,
  isSuccessfulPing,
  parsePingResponseTime,
  parsePingResult,
  summarizePingOutput,
};
