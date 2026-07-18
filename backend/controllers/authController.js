const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const { sendPasswordResetEmail } = require("../services/emailService");
const securityLog = require("../utils/securityLogger");

const RESET_TOKEN_WINDOW_MS = 24 * 60 * 60 * 1000;
const EMAIL_RESET_COOLDOWN_MS = 60 * 1000;
const EMAIL_RESET_NEUTRAL_MESSAGE = "If an eligible account exists, a password reset link will be sent shortly.";
const hashResetToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
const getEmailResetTtlMinutes = () => Math.max(1, Number(process.env.RESET_TOKEN_TTL_MINUTES) || 15);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEmployeeId = (employeeId) => String(employeeId || "").trim();

const isEmailResetConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const maskEmail = (email = "") => {
  const [name = "", domain = ""] = email.split("@");
  if (!name || !domain) return "";

  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const createRawResetToken = () => crypto.randomBytes(32).toString("hex");
const buildPasswordResetLink = (rawToken) => `${getFrontendUrl()}/reset-password/${encodeURIComponent(rawToken)}`;

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  employeeId: user.employeeId,
  role: user.role,
  department: user.department,
  ministry: user.ministry,
  designation: user.designation,
  phone: user.phone,
  officeLocation: user.officeLocation,
});

const serializeResetUser = (user) => ({
  id: user._id,
  name: user.name,
  employeeId: user.employeeId,
  emailMasked: maskEmail(user.email),
  department: user.department,
  designation: user.designation,
});

const serializeResetRequest = (request) => {
  if (!request) return null;

  const resetRequest = {
    id: request._id,
    employeeId: request.employeeId,
    method: request.method,
    status: request.status,
    requestedAt: request.requestedAt,
    approvedAt: request.approvedAt,
    completedAt: request.completedAt,
    resetTokenExpiresAt: request.resetTokenExpiresAt,
  };

  if (request.user?.name) {
    resetRequest.user = serializeResetUser(request.user);
  }

  if (request.approvedBy?.name) {
    resetRequest.approvedBy = {
      id: request.approvedBy._id,
      name: request.approvedBy.name,
      employeeId: request.approvedBy.employeeId,
    };
  }

  return resetRequest;
};

const findUserByEmployeeId = (employeeId) =>
  User.findOne({
    employeeId: {
      $regex: `^${escapeRegex(employeeId)}$`,
      $options: "i",
    },
  });

const getActivePasswordResetRequest = async (userId) => {
  const request = await PasswordResetRequest.findOne({
    user: userId,
    status: { $in: ["pending", "approved"] },
  })
    .sort({ createdAt: -1 })
    .populate("user", "name email employeeId department designation");

  if (
    request?.status === "approved" &&
    request.resetTokenExpiresAt &&
    request.resetTokenExpiresAt <= new Date()
  ) {
    request.status = "expired";
    request.resetTokenHash = null;
    request.resetTokenExpiresAt = null;
    await request.save();
    return null;
  }

  return request;
};

const validatePasswordResetToken = async (token) => {
  const request = await PasswordResetRequest.findOne({
    resetTokenHash: hashResetToken(token),
    status: "approved",
    resetTokenExpiresAt: { $gt: new Date() },
  }).select("+resetTokenHash").populate(
    "user",
    "name email employeeId department designation password"
  );

  if (!request) throw new Error("Reset link is invalid or expired");

  return request;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, employeeId, department, ministry, designation, phone, officeLocation } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedEmployeeId = normalizeEmployeeId(employeeId);

    if (!name || !normalizedEmail || !normalizedEmployeeId || !password) {
      return res.status(400).json({
        message: "Name, email, employee ID and password are required",
      });
    }

    const userExists = await User.findOne({
      $or: [
        { email: normalizedEmail },
        {
          employeeId: {
            $regex: `^${escapeRegex(normalizedEmployeeId)}$`,
            $options: "i",
          },
        },
      ],
    });

    if (userExists) {
      return res.status(400).json({
        message: "User with this email or employee ID already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      employeeId: normalizedEmployeeId,
      password: hashedPassword,
      role: "department_user",
      department,
      ministry,
      designation,
      phone,
      officeLocation,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(user),
      token: generateToken(user._id),
    });
    securityLog("user_registered", { userId: user._id.toString(), role: user.role });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    const normalizedEmployeeId = normalizeEmployeeId(employeeId);

    if (!normalizedEmployeeId || !password) {
      return res.status(400).json({
        message: "Employee ID and password are required",
      });
    }

    const user = await findUserByEmployeeId(normalizedEmployeeId);

    if (!user) {
      securityLog("login_failed", { reason: "invalid_credentials" });
      return res.status(401).json({
        message: "Invalid employee ID or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      securityLog("login_failed", { reason: "invalid_credentials" });
      return res.status(401).json({
        message: "Invalid employee ID or password",
      });
    }

    securityLog("login_succeeded", { userId: user._id.toString(), role: user.role });
    res.status(200).json({
      message: "Login successful",
      user: serializeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const checkPasswordResetStatus = async (req, res) => {
  try {
    const normalizedEmployeeId = normalizeEmployeeId(req.body.employeeId);

    if (!normalizedEmployeeId) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    const user = await findUserByEmployeeId(normalizedEmployeeId).select("-password");

    if (!user) {
      return res.status(200).json({
        registered: true,
        emailResetConfigured: isEmailResetConfigured(),
        message: EMAIL_RESET_NEUTRAL_MESSAGE,
      });
    }

    const activeRequest = await getActivePasswordResetRequest(user._id);

    res.status(200).json({
      registered: true,
      user: serializeResetUser(user),
      emailResetConfigured: isEmailResetConfigured(),
      request: serializeResetRequest(activeRequest),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const normalizedEmployeeId = normalizeEmployeeId(req.body.employeeId);
    const method = req.body.method || "it_admin";

    if (!normalizedEmployeeId) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    if (!["it_admin", "email"].includes(method)) {
      return res.status(400).json({
        message: "Invalid reset method",
      });
    }

    const user = await findUserByEmployeeId(normalizedEmployeeId).select("-password");

    if (!user) {
      return res.status(200).json({ message: EMAIL_RESET_NEUTRAL_MESSAGE });
    }

    const activeRequest = await getActivePasswordResetRequest(user._id);

    if (activeRequest) {
      return res.status(200).json({
        registered: true,
        user: serializeResetUser(user),
        emailResetConfigured: isEmailResetConfigured(),
        request: serializeResetRequest(activeRequest),
        message:
          activeRequest.status === "approved"
            ? EMAIL_RESET_NEUTRAL_MESSAGE
            : "Your password reset request is already pending with IT admin.",
      });
    }

    if (method === "email" && !isEmailResetConfigured()) {
      return res.status(400).json({
        registered: true,
        user: serializeResetUser(user),
        emailResetConfigured: false,
        message: "Email reset is not configured yet. Please use IT admin approval.",
      });
    }

    const rawToken = method === "email" ? createRawResetToken() : null;
    const request = await PasswordResetRequest.create({
      user: user._id,
      employeeId: user.employeeId,
      method,
      status: method === "email" ? "approved" : "pending",
      requestedAt: new Date(),
      approvedAt: method === "email" ? new Date() : null,
      resetTokenExpiresAt: method === "email" ? new Date(Date.now() + RESET_TOKEN_WINDOW_MS) : null,
      resetTokenHash: rawToken ? hashResetToken(rawToken) : null,
    });

    await request.populate("user", "name email employeeId department designation");

    if (rawToken && request.user?.email) {
      try {
        await sendPasswordResetEmail({ to: request.user.email, resetUrl: buildPasswordResetLink(rawToken), ttlMinutes: 1440 });
      } catch {
        request.status = "expired";
        request.resetTokenHash = null;
        request.resetTokenExpiresAt = null;
        await request.save();
        return res.status(503).json({ message: "Password reset delivery failed. Please try again later." });
      }
    }

    res.status(201).json({
      registered: true,
      user: serializeResetUser(user),
      emailResetConfigured: isEmailResetConfigured(),
      request: serializeResetRequest(request),
      message:
        method === "email"
          ? EMAIL_RESET_NEUTRAL_MESSAGE
          : "Your request has been sent to IT admin. You will receive secure reset instructions if approved.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getPasswordResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name email employeeId department designation")
      .populate("approvedBy", "name employeeId");

    res.status(200).json({
      count: requests.length,
      requests: requests.map((request) => serializeResetRequest(request)),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const approvePasswordResetRequest = async (req, res) => {
  try {
    if (!isEmailResetConfigured()) {
      return res.status(503).json({ message: "Secure password reset delivery is not configured." });
    }
    const request = await PasswordResetRequest.findById(req.params.id).populate(
      "user",
      "name email employeeId department designation"
    );

    if (!request) {
      return res.status(404).json({
        message: "Password reset request not found",
      });
    }

    if (!["pending", "approved"].includes(request.status)) {
      return res.status(400).json({
        message: `This request is already ${request.status}.`,
      });
    }

    request.status = "approved";
    request.approvedAt = new Date();
    request.approvedBy = req.user._id;
    request.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_WINDOW_MS);
    const rawToken = createRawResetToken();
    request.resetTokenHash = hashResetToken(rawToken);
    await request.save();
    await request.populate("approvedBy", "name employeeId");

    if (request.user?.email && isEmailResetConfigured()) {
      try {
        await sendPasswordResetEmail({ to: request.user.email, resetUrl: buildPasswordResetLink(rawToken), ttlMinutes: 1440 });
      } catch {
        request.status = "expired";
        request.resetTokenHash = null;
        request.resetTokenExpiresAt = null;
        await request.save();
        return res.status(503).json({ message: "Password reset delivery failed. Please try again later." });
      }
    }
    securityLog("password_reset_approved", { requestId: request._id.toString(), approvedBy: req.user._id.toString() });

    res.status(200).json({
      message: "Password reset request approved.",
      request: serializeResetRequest(request),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const cancelPasswordResetRequest = async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id).populate(
      "user",
      "name email employeeId department designation"
    );

    if (!request) {
      return res.status(404).json({
        message: "Password reset request not found",
      });
    }

    if (!["pending", "approved"].includes(request.status)) {
      return res.status(400).json({
        message: `This request is already ${request.status}.`,
      });
    }

    request.status = "cancelled";
    request.resetTokenHash = null;
    request.resetTokenExpiresAt = null;
    await request.save();

    res.status(200).json({
      message: "Password reset request cancelled.",
      request: serializeResetRequest(request),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getResetTokenStatus = async (req, res) => {
  try {
    const tokenHash = hashResetToken(req.params.token);
    const emailUser = await User.findOne({ resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: { $gt: new Date() } })
      .select("+resetPasswordTokenHash +resetPasswordExpiresAt name email employeeId department designation");
    if (emailUser) {
      return res.status(200).json({ valid: true, user: serializeResetUser(emailUser), expiresAt: emailUser.resetPasswordExpiresAt });
    }
    const request = await validatePasswordResetToken(req.params.token);

    res.status(200).json({
      valid: true,
      user: serializeResetUser(request.user),
      expiresAt: request.resetTokenExpiresAt,
    });
  } catch (error) {
    res.status(400).json({
      valid: false,
      message: "Reset link is invalid or expired",
    });
  }
};

const requestEmailPasswordReset = async (req, res) => {
  const normalizedEmployeeId = normalizeEmployeeId(req.body.employeeId);
  if (!normalizedEmployeeId) return res.status(400).json({ message: "Employee ID is required" });

  try {
    const user = await findUserByEmployeeId(normalizedEmployeeId)
      .select("+resetPasswordTokenHash +resetPasswordExpiresAt +resetPasswordRequestedAt");
    if (!user?.email) return res.status(200).json({ message: EMAIL_RESET_NEUTRAL_MESSAGE });

    if (user.resetPasswordRequestedAt && Date.now() - user.resetPasswordRequestedAt.getTime() < EMAIL_RESET_COOLDOWN_MS) {
      return res.status(200).json({ message: EMAIL_RESET_NEUTRAL_MESSAGE });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const ttlMinutes = getEmailResetTtlMinutes();
    user.resetPasswordTokenHash = hashResetToken(rawToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    user.resetPasswordRequestedAt = new Date();
    await user.save();

    const frontendUrl = getFrontendUrl();
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;
    try {
      await sendPasswordResetEmail({ to: user.email, resetUrl, ttlMinutes });
    } catch {
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordExpiresAt = undefined;
      user.resetPasswordRequestedAt = undefined;
      await user.save();
    }
    return res.status(200).json({ message: EMAIL_RESET_NEUTRAL_MESSAGE });
  } catch {
    return res.status(200).json({ message: EMAIL_RESET_NEUTRAL_MESSAGE });
  }
};

const completeEmailPasswordReset = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });
    if (String(newPassword).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findOne({
      resetPasswordTokenHash: hashResetToken(req.params.token),
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpiresAt +resetPasswordRequestedAt password");
    if (!user) return res.status(400).json({ message: "Reset link is invalid or expired" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    user.resetPasswordRequestedAt = undefined;
    await user.save();
    securityLog("password_reset_completed", { userId: user._id.toString(), method: "email" });
    return res.status(200).json({ message: "Password reset successful. You can sign in with your new password now." });
  } catch {
    return res.status(400).json({ message: "Reset link is invalid or expired" });
  }
};

const completePasswordReset = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Reset token and new password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const request = await validatePasswordResetToken(token);
    const salt = await bcrypt.genSalt(10);

    request.user.password = await bcrypt.hash(password, salt);
    await request.user.save();

    request.status = "completed";
    request.completedAt = new Date();
    request.resetTokenHash = null;
    request.resetTokenExpiresAt = null;
    await request.save();
    securityLog("password_reset_completed", { requestId: request._id.toString(), userId: request.user._id.toString() });

    res.status(200).json({
      message: "Password reset successful. You can sign in with your new password now.",
    });
    } catch (error) {
      res.status(400).json({
      message: "Reset link is invalid or expired",
      });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const validRoles = [
      "admin",
      "system_admin",
      "head_of_it",
      "technician",
      "department_user",
      "store_keeper",
      "procurement_officer",
      "management",
    ];

    if (!userId || !role) {
      return res.status(400).json({
        message: "User ID and role are required",
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role specified",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();
    securityLog("user_role_changed", { userId: user._id.toString(), changedBy: req.user._id.toString(), role });

    res.status(200).json({
      message: "User role updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  checkPasswordResetStatus,
  requestPasswordReset,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  cancelPasswordResetRequest,
  getResetTokenStatus,
  completePasswordReset,
  requestEmailPasswordReset,
  completeEmailPasswordReset,
  getUsers,
  updateUserRole,
  passwordResetTestUtils: { hashResetToken, getEmailResetTtlMinutes, EMAIL_RESET_NEUTRAL_MESSAGE },
};
