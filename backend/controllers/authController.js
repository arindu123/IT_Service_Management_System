const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

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

// Register user
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      role,
      department,
      designation,
      phone,
      officeLocation,
    } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user - default role is department_user for safety
    const user = await User.create({
      name,
      email,
      employeeId,
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

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Check user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
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
// Get all users
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

// Update user role - admin only
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
  getUsers,
  updateUserRole,
};
