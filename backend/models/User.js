const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    employeeId: {
      type: String,
      default: "",
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "admin",
        "system_admin",
        "head_of_it",
        "technician",
        "department_user",
        "store_keeper",
        "procurement_officer",
        "management",
      ],
      default: "department_user",
    },

    department: {
      type: String,
      default: "",
    },

    ministry: {
      type: String,
      default: "",
      trim: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    officeLocation: {
      type: String,
      default: "",
      trim: true,
    },

    resetPasswordTokenHash: { type: String, select: false, default: null },
    resetPasswordExpiresAt: { type: Date, select: false, default: null },
    resetPasswordRequestedAt: { type: Date, select: false, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
