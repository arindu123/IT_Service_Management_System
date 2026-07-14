const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PasswordResetRequest = require("../models/PasswordResetRequest");

const RESET_TOKEN_WINDOW_MS = 24 * 60 * 60 * 1000;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEmployeeId = (employeeId) => String(employeeId || "").trim();

const isEmailResetConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

const maskEmail = (email = "") => {
  const [name = "", domain = ""] = email.split("@");
  if (!name || !domain) return "";

  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const createPasswordResetToken = (request) => {
  const expiresAt = request.resetTokenExpiresAt || new Date(Date.now() + RESET_TOKEN_WINDOW_MS);
  const expiresIn = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const userId = request.user?._id?.toString?.() || request.user?.toString?.();

  return jwt.sign(
    {
      type: "password_reset",
      requestId: request._id.toString(),
      userId,
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

const buildPasswordResetLink = (request) =>
  `${getFrontendUrl()}/reset-password/${encodeURIComponent(createPasswordResetToken(request))}`;

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  employeeId: user.employeeId,
  role: user.role,
  department: user.department,
  designation: user.designation,
  phone: user.phone,
  officeLocation: user.officeLocation,
});

const serializeResetUser = (user) => ({
  id: user._id,
  name: user.name,
  employeeId: user.employeeId,
  email: user.email,
  emailMasked: maskEmail(user.email),
  department: user.department,
  designation: user.designation,
});

const serializeResetRequest = (request, { includeResetLink = false } = {}) => {
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

  if (
    includeResetLink &&
    request.status === "approved" &&
    request.resetTokenExpiresAt &&
    request.resetTokenExpiresAt > new Date()
  ) {
    resetRequest.resetLink = buildPasswordResetLink(request);
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
    await request.save();
    return null;
  }

  return request;
};

const validatePasswordResetToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.type !== "password_reset") {
    throw new Error("Invalid reset link");
  }

  const request = await PasswordResetRequest.findById(decoded.requestId).populate(
    "user",
    "name email employeeId department designation password"
  );

  if (
    !request ||
    request.status !== "approved" ||
    request.user?._id?.toString() !== decoded.userId ||
    !request.resetTokenExpiresAt ||
    request.resetTokenExpiresAt <= new Date()
  ) {
    throw new Error("Reset link is invalid or expired");
  }

  return request;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, employeeId, department, designation, phone, officeLocation } = req.body;

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
      designation,
      phone,
      officeLocation,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
      return res.status(401).json({
        message: "Invalid employee ID or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid employee ID or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: serializeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
        registered: false,
        message: "Employee ID is not registered.",
      });
    }

    const activeRequest = await getActivePasswordResetRequest(user._id);

    res.status(200).json({
      registered: true,
      user: serializeResetUser(user),
      emailResetConfigured: isEmailResetConfigured(),
      request: serializeResetRequest(activeRequest, { includeResetLink: true }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
      return res.status(404).json({
        registered: false,
        message: "Employee ID is not registered.",
      });
    }

    const activeRequest = await getActivePasswordResetRequest(user._id);

    if (activeRequest) {
      return res.status(200).json({
        registered: true,
        user: serializeResetUser(user),
        emailResetConfigured: isEmailResetConfigured(),
        request: serializeResetRequest(activeRequest, { includeResetLink: true }),
        message:
          activeRequest.status === "approved"
            ? "Your reset link is ready."
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

    const request = await PasswordResetRequest.create({
      user: user._id,
      employeeId: user.employeeId,
      method,
      status: method === "email" ? "approved" : "pending",
      requestedAt: new Date(),
      approvedAt: method === "email" ? new Date() : null,
      resetTokenExpiresAt: method === "email" ? new Date(Date.now() + RESET_TOKEN_WINDOW_MS) : null,
    });

    await request.populate("user", "name email employeeId department designation");

    res.status(201).json({
      registered: true,
      user: serializeResetUser(user),
      emailResetConfigured: isEmailResetConfigured(),
      request: serializeResetRequest(request, { includeResetLink: method === "email" }),
      message:
        method === "email"
          ? "A reset link has been generated for your email reset request."
          : "Your request has been sent to IT admin. Check this page later for the reset link.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
      error: error.message,
    });
  }
};

const approvePasswordResetRequest = async (req, res) => {
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

    request.status = "approved";
    request.approvedAt = new Date();
    request.approvedBy = req.user._id;
    request.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_WINDOW_MS);
    await request.save();
    await request.populate("approvedBy", "name employeeId");

    res.status(200).json({
      message: "Password reset request approved.",
      request: serializeResetRequest(request),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
    await request.save();

    res.status(200).json({
      message: "Password reset request cancelled.",
      request: serializeResetRequest(request),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getResetTokenStatus = async (req, res) => {
  try {
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
    await request.save();

    res.status(200).json({
      message: "Password reset successful. You can sign in with your new password now.",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Reset link is invalid or expired",
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
      error: error.message,
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

    res.status(200).json({
      message: "User role updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
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
  getUsers,
  updateUserRole,
};
