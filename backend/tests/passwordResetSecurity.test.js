const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { passwordResetTestUtils } = require("../controllers/authController");

test("email reset hashes a 32-byte token with SHA-256", () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = passwordResetTestUtils.hashResetToken(rawToken);
  assert.equal(rawToken.length, 64);
  assert.equal(hash.length, 64);
  assert.notEqual(hash, rawToken);
  assert.equal(hash, crypto.createHash("sha256").update(rawToken).digest("hex"));
});

test("email reset defaults to a 15 minute lifetime", () => {
  const previous = process.env.RESET_TOKEN_TTL_MINUTES;
  delete process.env.RESET_TOKEN_TTL_MINUTES;
  assert.equal(passwordResetTestUtils.getEmailResetTtlMinutes(), 15);
  if (previous === undefined) delete process.env.RESET_TOKEN_TTL_MINUTES;
  else process.env.RESET_TOKEN_TTL_MINUTES = previous;
});

test("email reset uses one neutral response text", () => {
  assert.equal(
    passwordResetTestUtils.EMAIL_RESET_NEUTRAL_MESSAGE,
    "If an eligible account exists, a password reset link will be sent shortly."
  );
});
